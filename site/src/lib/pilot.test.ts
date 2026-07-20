import { describe, expect, it } from "vitest";
import { pilotApplicationSchema } from "./pilot";

const validApplication = {
  fullName: "Dr Maya Rao",
  email: "maya@example.com",
  phone: "",
  role: "doctor",
  specialty: "General medicine",
  organization: "",
  city: "chennai",
  otherCity: "",
  dailyPatientVolume: "20_40",
  documentationMethod: "mixed",
  repeatVisitShare: "25_50",
  pilotInterest: "Understand whether the review flow fits the clinic day.",
  consentToContact: true,
  privacyPolicyVersion: "2026-07-20",
  source: "website",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  website: "",
};

describe("pilot application validation", () => {
  it("accepts a complete supported-city application", () => {
    expect(pilotApplicationSchema.safeParse(validApplication).success).toBe(true);
  });

  it("requires contact consent", () => {
    expect(pilotApplicationSchema.safeParse({ ...validApplication, consentToContact: false }).success).toBe(false);
  });

  it("requires a name for an unsupported city", () => {
    expect(pilotApplicationSchema.safeParse({ ...validApplication, city: "other", otherCity: "" }).success).toBe(false);
  });

  it("limits free text to 600 characters", () => {
    expect(pilotApplicationSchema.safeParse({ ...validApplication, pilotInterest: "a".repeat(601) }).success).toBe(false);
  });
});
