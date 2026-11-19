/**
 * Public business details and store policy terms.
 *
 * These details appear publicly on /contact, /refund-policy and /shipping-policy.
 * A value in square brackets is a placeholder: `npm run check:business` fails the
 * build while any placeholder remains.
 */
export const business = {
  /** Must match the Certificate of Incorporation exactly. */
  legalName: "AiraLexo Solutions Private Limited",
  supportEmail: "edwin@airalexo.in",
  /** Include the country code, for example +91 98765 43210. */
  supportPhone: "+91 88700 44907",
  /** Registered office address as printed on the Certificate of Incorporation. */
  registeredAddress: [
    "F.1#348a, Om Shakthi Flt,",
    "Village High Road, Sholinganallur,",
    "Saidapet, Kanchipuram,",
    "Tamil Nadu 600119, India",
  ],
  /** Named under the Consumer Protection (E-Commerce) Rules, 2020. */
  grievanceOfficer: { name: "Edwin Swanith", designation: "Co-founder" },
  /** Days and hours when the support line is answered. */
  supportHours: "Monday to Saturday, 10:00 to 18:00 IST",
} as const;

/** Store policy terms. These are business decisions: confirm them with your lawyer or CA. */
export const storePolicy = {
  /** Last date these policy terms changed. Update whenever a value below changes. */
  lastUpdated: "2026-11-19",
  returnWindowDays: 7,
  warrantyMonths: 6,
  dispatchWorkingDays: "2 to 3",
  deliveryWorkingDays: "3 to 7",
  refundWorkingDays: "5 to 7",
  shippingCharge: "Free",
  shipsTo: "addresses within India",
} as const;

/** Digits only, for tel: and WhatsApp links. */
export function phoneDigits(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

export function isPlaceholder(value: string) {
  return value.startsWith("[") && value.endsWith("]");
}

export function formatPolicyDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}
