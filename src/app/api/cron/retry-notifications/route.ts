import { NextRequest, NextResponse } from "next/server";
import { sendPilotNotifications } from "@/lib/notifications";
import { getDatabase } from "@/lib/mongodb";
import { expireStaleOrders } from "@/lib/orders";
import { deleteExpiredApplications, findApplicationsAwaitingRetry, fromStoredApplication, setNotificationStatus } from "@/lib/pilot-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDatabase();
    if (!db) return NextResponse.json({ status: "unavailable" }, { status: 500 });

    await deleteExpiredApplications(db);
    const expiredOrders = await expireStaleOrders(db);
    const rows = await findApplicationsAwaitingRetry(db);

    let sent = 0;
    for (const row of rows) {
      const result = await sendPilotNotifications(fromStoredApplication(row), row.access_track);
      if (result.sent && row._id) {
        sent += 1;
        await setNotificationStatus(db, row._id, "sent");
      }
    }
    return NextResponse.json({ status: "complete", processed: rows.length, sent, expiredOrders });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 500 });
  }
}
