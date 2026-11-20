import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/mongodb";
import { isStoreEnabled } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Deployment check: reports which build is serving and which features are switched on.
 * It never returns secret values, only whether each setting is present.
 */
export function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || "";
  const storeSetting = process.env.STORE_ENABLED;
  return NextResponse.json({
    environment: process.env.VERCEL_ENV || "local",
    build: (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 7),
    store: {
      enabled: isStoreEnabled(),
      settingPresent: storeSetting !== undefined,
      settingLength: storeSetting?.length ?? 0,
    },
    razorpay: {
      mode: keyId.startsWith("rzp_live_") ? "live" : keyId.startsWith("rzp_test_") ? "test" : keyId ? "unknown" : "missing",
      secretPresent: Boolean(process.env.RAZORPAY_KEY_SECRET),
      webhookSecretPresent: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    },
    database: isDatabaseConfigured(),
    email: {
      sender: Boolean(process.env.RESEND_API_KEY),
      pilotAlerts: Boolean(process.env.PILOT_NOTIFICATION_EMAIL),
      orderAlerts: Boolean(process.env.ORDER_NOTIFICATION_EMAIL || process.env.PILOT_NOTIFICATION_EMAIL),
    },
  }, { headers: { "cache-control": "no-store" } });
}
