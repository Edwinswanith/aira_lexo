import { createHmac } from "node:crypto";
import { z } from "zod";

export const supportedCities = ["chennai", "bengaluru", "hyderabad", "mumbai", "coimbatore"] as const;

export const pilotApplicationSchema = z.object({
  fullName: z.string({ error: "Please enter your full name" }).trim().min(2, "Please enter your full name").max(100, "Please keep your name under 100 characters"),
  email: z.string({ error: "Please enter your email" }).trim().email("Please enter a valid email, like name@clinic.com").max(180).transform((value) => value.toLowerCase()),
  phone: z.string().trim().max(24, "Please enter a shorter phone number").optional().or(z.literal("")),
  role: z.enum(["doctor", "clinic_owner", "hospital_admin", "other"], { error: "Please choose your role" }),
  specialty: z.string({ error: "Please enter your specialty, for example General medicine" }).trim().min(2, "Please enter your specialty, for example General medicine").max(100),
  organization: z.string().trim().max(160).optional().or(z.literal("")),
  city: z.enum([...supportedCities, "other"], { error: "Please choose your city" }),
  otherCity: z.string().trim().max(100).optional().or(z.literal("")),
  dailyPatientVolume: z.enum(["under_20", "20_40", "41_60", "over_60"], { error: "Please choose how many patients you see a day" }),
  documentationMethod: z.enum(["paper", "emr", "dictation", "mixed", "other"], { error: "Please choose how you keep notes today" }),
  repeatVisitShare: z.enum(["under_25", "25_50", "over_50", "unsure"], { error: "Please choose a range, or Not sure" }),
  pilotInterest: z.string().trim().max(600, "Keep your answer within 600 characters").optional().or(z.literal("")),
  consentToContact: z.literal(true, { error: "Please tick this box so we can contact you" }),
  privacyPolicyVersion: z.string().trim().min(1).max(30),
  source: z.string().trim().max(100).optional().or(z.literal("")),
  utmSource: z.string().trim().max(100).optional().or(z.literal("")),
  utmMedium: z.string().trim().max(100).optional().or(z.literal("")),
  utmCampaign: z.string().trim().max(100).optional().or(z.literal("")),
  website: z.string().max(0).optional().or(z.literal("")),
}).superRefine((value, context) => {
  if (value.city === "other" && !value.otherCity) {
    context.addIssue({ code: "custom", path: ["otherCity"], message: "Please enter your city" });
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
