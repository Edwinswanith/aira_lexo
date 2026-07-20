import { NextRequest, NextResponse } from "next/server";
import { sendPilotNotifications } from "@/lib/notifications";
import type { PilotApplicationRequest } from "@/lib/pilot";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

type StoredApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: PilotApplicationRequest["role"];
  specialty: string;
  organization: string | null;
  city: PilotApplicationRequest["city"];
  other_city: string | null;
  daily_patient_volume: PilotApplicationRequest["dailyPatientVolume"];
  documentation_method: PilotApplicationRequest["documentationMethod"];
  repeat_visit_share: PilotApplicationRequest["repeatVisitShare"];
  pilot_interest: string | null;
  privacy_policy_version: string;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  access_track: "received" | "future_access";
};

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ status: "unavailable" }, { status: 500 });

  const retentionCutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("pilot_applications").delete().lt("created_at", retentionCutoff);
  const { data, error } = await supabase.from("pilot_applications").select("*").eq("notification_status", "retry").limit(25);
  if (error) return NextResponse.json({ status: "unavailable" }, { status: 500 });

  let sent = 0;
  for (const row of (data || []) as StoredApplication[]) {
    const application: PilotApplicationRequest = {
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || "",
      role: row.role,
      specialty: row.specialty,
      organization: row.organization || "",
      city: row.city,
      otherCity: row.other_city || "",
      dailyPatientVolume: row.daily_patient_volume,
      documentationMethod: row.documentation_method,
      repeatVisitShare: row.repeat_visit_share,
      pilotInterest: row.pilot_interest || "",
      consentToContact: true,
      privacyPolicyVersion: row.privacy_policy_version,
      source: row.source || "",
      utmSource: row.utm_source || "",
      utmMedium: row.utm_medium || "",
      utmCampaign: row.utm_campaign || "",
      website: "",
    };
    const result = await sendPilotNotifications(application, row.access_track);
    if (result.sent) {
      sent += 1;
      await supabase.from("pilot_applications").update({ notification_status: "sent" }).eq("id", row.id);
    }
  }
  return NextResponse.json({ status: "complete", processed: data?.length || 0, sent });
}
