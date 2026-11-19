import { NextRequest, NextResponse } from "next/server";
import { pilotApplicationSchema, hashNetworkIdentifier, supportedCities, toFieldErrors } from "@/lib/pilot";
import { getDatabase, isDatabaseConfigured } from "@/lib/mongodb";
import { allowSubmission, hasRecentApplication, insertApplication, setNotificationStatus, toStoredApplication } from "@/lib/pilot-store";
import { sendPilotNotifications } from "@/lib/notifications";

export const runtime = "nodejs";

const localSubmissions = new Map<string, number[]>();
const localEmails = new Map<string, number>();

function networkIdentifier(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid", errors: { form: "Submit a valid application" } }, { status: 400 });
  }

  const parsed = pilotApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", errors: toFieldErrors(parsed.error) }, { status: 400 });
  }

  if (parsed.data.website) {
    return NextResponse.json({ status: "invalid", errors: { form: "We could not accept this application" } }, { status: 400 });
  }

  let networkHash: string;
  try {
    networkHash = hashNetworkIdentifier(networkIdentifier(request));
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 500 });
  }

  const isProduction = process.env.VERCEL_ENV === "production";
  if (!isDatabaseConfigured() && isProduction) {
    return NextResponse.json({ status: "unavailable" }, { status: 500 });
  }

  const responseStatus = supportedCities.includes(parsed.data.city as typeof supportedCities[number]) ? "received" : "future_access";

  if (isDatabaseConfigured()) {
    try {
      const db = await getDatabase();
      if (!db) return NextResponse.json({ status: "unavailable" }, { status: 500 });

      if (!(await allowSubmission(db, networkHash))) {
        return NextResponse.json({ status: "rate_limited" }, { status: 429 });
      }
      if (await hasRecentApplication(db, parsed.data.email)) {
        return NextResponse.json({ status: "already_received" }, { status: 200 });
      }

      const id = await insertApplication(db, toStoredApplication(parsed.data, responseStatus));
      const notification = await sendPilotNotifications(parsed.data, responseStatus);
      await setNotificationStatus(db, id, notification.sent ? "sent" : "retry");
      return NextResponse.json({ status: responseStatus }, { status: 201 });
    } catch {
      return NextResponse.json({ status: "unavailable" }, { status: 500 });
    }
  }

  // Local development without a database: memory-only, so the journey can still be tested.
  const now = Date.now();
  const recent = (localSubmissions.get(networkHash) || []).filter((time) => time > now - 15 * 60 * 1000);
  if (recent.length >= 5) return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  const emailTime = localEmails.get(parsed.data.email);
  if (emailTime && emailTime > now - 30 * 24 * 60 * 60 * 1000) return NextResponse.json({ status: "already_received" }, { status: 200 });
  localSubmissions.set(networkHash, [...recent, now]);
  localEmails.set(parsed.data.email, now);
  return NextResponse.json({ status: responseStatus }, { status: 201 });
}
