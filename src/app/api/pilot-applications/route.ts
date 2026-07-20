import { NextRequest, NextResponse } from "next/server";
import { pilotApplicationSchema, hashNetworkIdentifier, supportedCities, toFieldErrors } from "@/lib/pilot";
import { getSupabaseAdmin } from "@/lib/supabase";
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

  const supabase = getSupabaseAdmin();
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!supabase && isProduction) {
    return NextResponse.json({ status: "unavailable" }, { status: 500 });
  }

  if (supabase) {
    const { data: allowed, error: rateError } = await supabase.rpc("check_pilot_rate_limit", { network_hash_input: networkHash });
    if (rateError) return NextResponse.json({ status: "unavailable" }, { status: 500 });
    if (!allowed) return NextResponse.json({ status: "rate_limited" }, { status: 429 });

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing, error: duplicateError } = await supabase
      .from("pilot_applications")
      .select("id")
      .eq("email", parsed.data.email)
      .gte("created_at", cutoff)
      .limit(1);
    if (duplicateError) return NextResponse.json({ status: "unavailable" }, { status: 500 });
    if (existing?.length) return NextResponse.json({ status: "already_received" }, { status: 200 });

    const responseStatus = supportedCities.includes(parsed.data.city as typeof supportedCities[number]) ? "received" : "future_access";
    const { data: inserted, error: insertError } = await supabase
      .from("pilot_applications")
      .insert({
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        role: parsed.data.role,
        specialty: parsed.data.specialty,
        organization: parsed.data.organization || null,
        city: parsed.data.city,
        other_city: parsed.data.otherCity || null,
        daily_patient_volume: parsed.data.dailyPatientVolume,
        documentation_method: parsed.data.documentationMethod,
        repeat_visit_share: parsed.data.repeatVisitShare,
        pilot_interest: parsed.data.pilotInterest || null,
        application_status: "new",
        notification_status: "pending",
        source: parsed.data.source || null,
        utm_source: parsed.data.utmSource || null,
        utm_medium: parsed.data.utmMedium || null,
        utm_campaign: parsed.data.utmCampaign || null,
        privacy_policy_version: parsed.data.privacyPolicyVersion,
        consent_timestamp: new Date().toISOString(),
        access_track: responseStatus,
      })
      .select("id")
      .single();
    if (insertError || !inserted) return NextResponse.json({ status: "unavailable" }, { status: 500 });

    const notification = await sendPilotNotifications(parsed.data, responseStatus);
    await supabase.from("pilot_applications").update({ notification_status: notification.sent ? "sent" : "retry" }).eq("id", inserted.id);
    return NextResponse.json({ status: responseStatus }, { status: 201 });
  }

  const now = Date.now();
  const recent = (localSubmissions.get(networkHash) || []).filter((time) => time > now - 15 * 60 * 1000);
  if (recent.length >= 5) return NextResponse.json({ status: "rate_limited" }, { status: 429 });
  const emailTime = localEmails.get(parsed.data.email);
  if (emailTime && emailTime > now - 30 * 24 * 60 * 60 * 1000) return NextResponse.json({ status: "already_received" }, { status: 200 });
  localSubmissions.set(networkHash, [...recent, now]);
  localEmails.set(parsed.data.email, now);
  const responseStatus = supportedCities.includes(parsed.data.city as typeof supportedCities[number]) ? "received" : "future_access";
  return NextResponse.json({ status: responseStatus }, { status: 201 });
}
