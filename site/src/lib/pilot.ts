import { createHmac } from "node:crypto";
import { z } from "zod";

export const supportedCities = ["chennai", "bengaluru", "hyderabad", "mumbai", "coimbatore"] as const;

export const pilotApplicationSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(180).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  role: z.enum(["doctor", "clinic_owner", "hospital_admin", "other"]),
  specialty: z.string().trim().min(2, "Enter your specialty or area of work").max(100),
  organization: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.enum([...supportedCities, "other"]),
  otherCity: z.string().trim().max(100).optional().or(z.literal("")),
  dailyPatientVolume: z.enum(["under_20", "20_40", "41_60", "over_60"]),
  documentationMethod: z.enum(["paper", "emr", "dictation", "mixed", "other"]),
  repeatVisitShare: z.enum(["under_25", "25_50", "over_50", "unsure"]),
  pilotInterest: z.string().trim().max(600, "Keep your answer within 600 characters").optional().or(z.literal("")),
  consentToContact: z.literal(true, { error: "Please confirm that we may contact you" }),
  privacyPolicyVersion: z.string().trim().min(1).max(30),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  utmSource: z.string().trim().max(100).optional().or(z.literal("")),
  utmMedium: z.string().trim().max(100).optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(100).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (value.city === "other" && !value.otherCity) {
    context.addIssue({ code: "custom", path: ["otherCity"], message: "Enter your city" });
  }
});

export type PilotApplicationRequest = z.infer<typeof pilotApplicationSchema>;

export function hashNetworkIdentifier(value: string) {
  const secret = process.env.IP_HASH_SECRET;
  if (!secret && process.env.VERCEL_ENV === "production") throw new Error("Missing IP hash secret");
  return createHmac("sha256", secret || "aira-local-development-only").update(value).digest("hex");
}

export function toFieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] || "form");
    if (!fields[field]) fields[field] = issue.message;
  }
  return fields;
}
