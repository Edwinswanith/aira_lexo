import type { Db, ObjectId } from "mongodb";
import type { PilotApplicationRequest } from "./pilot";

export type AccessTrack = "received" | "future_access";
export type NotificationStatus = "pending" | "sent" | "retry";

export type StoredPilotApplication = {
  _id?: ObjectId;
  created_at: Date;
  updated_at: Date;
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
  application_status: "new" | "reviewed" | "shortlisted" | "waitlisted" | "contacted" | "closed";
  notification_status: NotificationStatus;
  access_track: AccessTrack;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  privacy_policy_version: string;
  consent_timestamp: Date;
};

type RateLimitEntry = { network_hash: string; created_at: Date };

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const DUPLICATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function applications(db: Db) {
  return db.collection<StoredPilotApplication>("pilot_applications");
}

export function toStoredApplication(data: PilotApplicationRequest, accessTrack: AccessTrack, now = new Date()): StoredPilotApplication {
  return {
    created_at: now,
    updated_at: now,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone || null,
    role: data.role,
    specialty: data.specialty,
    organization: data.organization || null,
    city: data.city,
    other_city: data.otherCity || null,
    daily_patient_volume: data.dailyPatientVolume,
    documentation_method: data.documentationMethod,
    repeat_visit_share: data.repeatVisitShare,
    pilot_interest: data.pilotInterest || null,
    application_status: "new",
    notification_status: "pending",
    access_track: accessTrack,
    source: data.source || null,
    utm_source: data.utmSource || null,
    utm_medium: data.utmMedium || null,
    utm_campaign: data.utmCampaign || null,
    privacy_policy_version: data.privacyPolicyVersion,
    consent_timestamp: now,
  };
}

export function fromStoredApplication(row: StoredPilotApplication): PilotApplicationRequest {
  return {
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
}

/**
 * Records this attempt, then counts attempts in the window. Recording first
 * means concurrent requests can only be over-counted, never let through.
 */
export async function allowSubmission(db: Db, networkHash: string, now = new Date()) {
  const rateLimits = db.collection<RateLimitEntry>("pilot_rate_limits");
  await rateLimits.insertOne({ network_hash: networkHash, created_at: now });
  const recent = await rateLimits.countDocuments({
    network_hash: networkHash,
    created_at: { $gt: new Date(now.getTime() - RATE_LIMIT_WINDOW_MS) },
  });
  return recent <= RATE_LIMIT_MAX;
}

export async function hasRecentApplication(db: Db, email: string, now = new Date()) {
  const existing = await applications(db).findOne(
    { email, created_at: { $gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) } },
    { projection: { _id: 1 } },
  );
  return existing !== null;
}

export async function insertApplication(db: Db, application: StoredPilotApplication) {
  const result = await applications(db).insertOne(application);
  return result.insertedId;
}

export async function setNotificationStatus(db: Db, id: ObjectId, status: NotificationStatus) {
  await applications(db).updateOne({ _id: id }, { $set: { notification_status: status, updated_at: new Date() } });
}

export async function findApplicationsAwaitingRetry(db: Db, limit = 25) {
  return applications(db).find({ notification_status: "retry" }).limit(limit).toArray();
}

/** Backstop for the 12-month TTL index, which MongoDB applies about once a minute. */
export async function deleteExpiredApplications(db: Db, now = new Date()) {
  const cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  await applications(db).deleteMany({ created_at: { $lt: cutoff } });
}
