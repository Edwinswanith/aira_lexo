import { z } from "zod";

/**
 * The single product sold on airalexo.in. Prices are in paise and include GST.
 * Price: Rs 9,999 before tax + 18% GST = Rs 11,798.82, sold at Rs 11,799.
 * PLACEHOLDER: the box contents are still dummy values. Replace before launch.
 */
export const product = {
  sku: "aira-recorder",
  name: "Aira consultation recorder",
  shortDescription: "A compact, one-button consultation recorder that you control, with access to the Aira review app.",
  /** Price before GST, shown to buyers as "Rs 9,999 + 18% GST". */
  basePricePaise: 999_900,
  unitPricePaise: 1_179_900,
  gstRatePercent: 18,
  maxQuantityPerOrder: 5,
  imagePath: "/images/product/aira-00-desk-lit.webp",
  imageAlt: "Aira recorder with its button lit amber",
  inTheBox: ["Aira recorder", "USB-C charging cable", "Onboarding call with our team", "12 months of Aira review app access"],
} as const;

/** Orders hold stock for this long while the customer pays. */
export const RESERVATION_MINUTES = 30;

/**
 * The store is always available on preview and local builds. On the live site
 * it stays hidden until STORE_ENABLED is set to "true" in Vercel Production.
 */
export function isStoreEnabled() {
  return process.env.VERCEL_ENV !== "production" || process.env.STORE_ENABLED === "true";
}

export function orderTotals(quantity: number) {
  const totalPaise = product.unitPricePaise * quantity;
  // Prices include GST, so the tax portion is total x rate / (100 + rate).
  const gstPaise = Math.round((totalPaise * product.gstRatePercent) / (100 + product.gstRatePercent));
  return { unitPricePaise: product.unitPricePaise, quantity, totalPaise, gstPaise, shippingPaise: 0 };
}

export function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: paise % 100 ? 2 : 0 }).format(paise / 100);
}

export const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const checkoutSchema = z.object({
  quantity: z.coerce.number().int().min(1, "Choose a quantity").max(product.maxQuantityPerOrder, `You can order up to ${product.maxQuantityPerOrder} at a time`),
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(180).transform((value) => value.toLowerCase()),
  phone: z.string().trim()
    .transform((value) => value.replace(/[\s-]/g, "").replace(/^(\+91|0091|91)(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10 digit Indian mobile number")),
  addressLine1: z.string().trim().min(5, "Enter your house, building, and street").max(150),
  addressLine2: optionalText(150),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.enum(indianStates, { error: "Select your state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6 digit PIN code"),
  gstin: z.string().trim().toUpperCase()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid 15 character GSTIN")
    .optional().or(z.literal("")),
  businessName: optionalText(160),
  acceptTerms: z.literal(true, { error: "Please accept the terms and policies to continue" }),
}).superRefine((value, context) => {
  if (value.gstin && !value.businessName) {
    context.addIssue({ code: "custom", path: ["businessName"], message: "Enter the business name registered for this GSTIN" });
  }
});

export type CheckoutRequest = z.infer<typeof checkoutSchema>;
