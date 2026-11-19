import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase } from "@/lib/mongodb";
import { confirmPaidOrder } from "@/lib/order-payment";
import { findOrderByNumber, recordPaymentFailure, tokenMatches } from "@/lib/orders";
import { fetchRazorpayPayment, verifyPaymentSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

const verifySchema = z.object({
  orderNumber: z.string().min(1).max(40),
  accessToken: z.string().min(16).max(100),
  razorpay_order_id: z.string().min(1).max(60),
  razorpay_payment_id: z.string().min(1).max(60),
  razorpay_signature: z.string().min(1).max(200),
});

/**
 * Called by the browser after Razorpay Checkout reports success. The browser's
 * word is never trusted: the signature is checked with our secret, and the
 * payment itself is fetched from Razorpay before the order is marked paid.
 */
export async function POST(request: NextRequest) {
  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ status: "invalid" }, { status: 400 });
  const input = parsed.data;

  const db = await getDatabase().catch(() => null);
  if (!db) return NextResponse.json({ status: "unavailable" }, { status: 503 });

  const order = await findOrderByNumber(db, input.orderNumber);
  if (!order || !tokenMatches(input.accessToken, order.access_token_hash) || order.razorpay_order_id !== input.razorpay_order_id) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }
  if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    return NextResponse.json({ status: "invalid_signature" }, { status: 400 });
  }

  try {
    const payment = await fetchRazorpayPayment(input.razorpay_payment_id);
    if (payment.order_id !== input.razorpay_order_id) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }
    if (payment.status === "failed") {
      await recordPaymentFailure(db, input.razorpay_order_id, payment.error_description || "Payment failed");
      return NextResponse.json({ status: "failed" }, { status: 402 });
    }
    if (payment.status !== "captured") {
      // Authorized but not yet captured: the webhook will confirm it shortly.
      return NextResponse.json({ status: "processing" }, { status: 202 });
    }

    const statusPath = `/order/${encodeURIComponent(order.order_number)}?t=${encodeURIComponent(input.accessToken)}`;
    const outcome = await confirmPaidOrder(db, {
      razorpayOrderId: payment.order_id,
      paymentId: payment.id,
      amountPaise: payment.amount,
      currency: payment.currency,
      method: payment.method,
      source: "checkout",
    }, statusPath);

    if (outcome.result === "paid" || outcome.result === "already_paid") return NextResponse.json({ status: "paid" });
    return NextResponse.json({ status: "needs_review" }, { status: 409 });
  } catch (error) {
    console.error("Payment verification failed", error);
    // The webhook remains a second path to confirmation.
    return NextResponse.json({ status: "processing" }, { status: 202 });
  }
}
