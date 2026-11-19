"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_COOKIE, createLoginToken, endAdminSession, isAdminEmail, redeemLoginToken, requireAdmin } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";
import { sendAdminLoginEmail, sendOrderShippedEmail } from "@/lib/order-emails";
import { addOrderNote, allowOrderAttempt, clearAttention, findOrderByNumber, releaseStock, setStock, transitionOrder } from "@/lib/orders";
import { refundRazorpayPayment } from "@/lib/razorpay";
import { originFromHeaders } from "@/lib/request-origin";

export async function requestLoginLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const db = await getDatabase().catch(() => null);
  if (!db) redirect("/admin/login?error=unavailable");
  const requestHeaders = await headers();
  const network = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!(await allowOrderAttempt(db, `admin-login:${createHash("sha256").update(network).digest("hex")}`))) {
    redirect("/admin/login?error=rate_limited");
  }
  // Same response whether or not the email is allowed, so the list cannot be probed.
  if (z.string().email().safeParse(email).success && isAdminEmail(email)) {
    const token = await createLoginToken(db, email);
    const sent = await sendAdminLoginEmail(email, `${originFromHeaders(requestHeaders)}/admin/verify?token=${encodeURIComponent(token)}`);
    if (!sent) console.error("Admin sign-in email was not sent. Check RESEND_API_KEY and the Resend logs.");
  }
  redirect("/admin/login?sent=1");
}

export async function completeLogin(formData: FormData) {
  const token = String(formData.get("token") || "");
  const db = await getDatabase().catch(() => null);
  if (!db || !token) redirect("/admin/login?error=expired");
  const session = await redeemLoginToken(db, token);
  if (!session) redirect("/admin/login?error=expired");
  (await cookies()).set(ADMIN_COOKIE, session.sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  redirect("/admin/orders");
}

export async function signOut() {
  const store = await cookies();
  const sessionId = store.get(ADMIN_COOKIE)?.value;
  const db = await getDatabase().catch(() => null);
  if (db && sessionId) await endAdminSession(db, sessionId);
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

function orderPath(orderNumber: string, message?: string) {
  return `/admin/orders/${encodeURIComponent(orderNumber)}${message ? `?message=${encodeURIComponent(message)}` : ""}`;
}

export async function updateOrderStatus(formData: FormData) {
  const { db, admin } = await requireAdmin();
  const orderNumber = String(formData.get("orderNumber") || "");
  const action = String(formData.get("action") || "");
  let message = "Order updated.";

  if (action === "pack") {
    const updated = await transitionOrder(db, orderNumber, ["paid"], "packed", admin.email);
    if (!updated) message = "Only paid orders can be marked packed.";
  } else if (action === "ship") {
    const parsed = z.object({
      courier: z.string().trim().min(2).max(80),
      trackingNumber: z.string().trim().min(3).max(80),
      trackingUrl: z.string().trim().url().max(300).optional().or(z.literal("")),
    }).safeParse({ courier: formData.get("courier"), trackingNumber: formData.get("trackingNumber"), trackingUrl: formData.get("trackingUrl") });
    if (!parsed.success) {
      redirect(orderPath(orderNumber, "Enter the courier and tracking number. The tracking link must be a full https:// address."));
    }
    const updated = await transitionOrder(db, orderNumber, ["paid", "packed"], "shipped", admin.email, {
      shipment: { courier: parsed.data.courier, tracking_number: parsed.data.trackingNumber, tracking_url: parsed.data.trackingUrl || null, shipped_at: new Date() },
    });
    if (!updated) message = "Only paid or packed orders can be shipped.";
    else message = (await sendOrderShippedEmail(updated)) ? "Marked shipped. The customer was emailed the tracking details." : "Marked shipped. The shipping email could not be sent, so tell the customer directly.";
  } else if (action === "deliver") {
    const updated = await transitionOrder(db, orderNumber, ["shipped"], "delivered", admin.email, { delivered_at: new Date() });
    if (!updated) message = "Only shipped orders can be marked delivered.";
  } else if (action === "clear_attention") {
    await clearAttention(db, orderNumber, admin.email);
    message = "Flag cleared.";
  } else if (action === "note") {
    await addOrderNote(db, orderNumber, String(formData.get("note") || ""), admin.email);
    message = "Note saved.";
  } else {
    message = "Unknown action.";
  }

  revalidatePath("/admin/orders");
  redirect(orderPath(orderNumber, message));
}

export async function refundOrder(formData: FormData) {
  const { db, admin } = await requireAdmin();
  const orderNumber = String(formData.get("orderNumber") || "");
  if (formData.get("confirm") !== "on") redirect(orderPath(orderNumber, "Tick the confirmation box to refund."));

  const order = await findOrderByNumber(db, orderNumber);
  if (!order || !order.razorpay_payment_id || !["paid", "packed", "shipped", "delivered"].includes(order.status)) {
    redirect(orderPath(orderNumber, "This order cannot be refunded."));
  }

  let refundId: string;
  try {
    const refund = await refundRazorpayPayment(order.razorpay_payment_id, order.amount_paise, { order_number: order.order_number });
    refundId = refund.id;
  } catch (error) {
    console.error("Refund failed", error);
    redirect(orderPath(orderNumber, "Razorpay did not accept the refund. Check the payment in the Razorpay dashboard."));
  }

  const updated = await transitionOrder(db, orderNumber, [order.status], "refunded", admin.email, {
    refund: { id: refundId, amount_paise: order.amount_paise, refunded_at: new Date() },
  });
  // Units that never left us go back into stock. Returned items are restocked by hand.
  if (updated && (order.status === "paid" || order.status === "packed")) await releaseStock(db, order.quantity);

  revalidatePath("/admin/orders");
  redirect(orderPath(orderNumber, `Refunded in full (${refundId}). The customer usually receives it in 5 to 7 working days.`));
}

export async function updateStock(formData: FormData) {
  const { db } = await requireAdmin();
  const parsed = z.coerce.number().int().min(0).max(100000).safeParse(formData.get("available"));
  if (!parsed.success) redirect("/admin/orders?message=" + encodeURIComponent("Enter a whole number of units, 0 or more."));
  await setStock(db, parsed.data);
  revalidatePath("/admin/orders");
  redirect("/admin/orders?message=" + encodeURIComponent(`Stock set to ${parsed.data}.`));
}
