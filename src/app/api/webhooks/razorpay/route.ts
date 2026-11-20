import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { confirmPaidOrder } from "@/lib/order-payment";
import { applyRefund } from "@/lib/order-refund";
import { recordPaymentFailure, recordWebhookEvent } from "@/lib/orders";
import { verifyWebhookSignature, type RazorpayPayment } from "@/lib/razorpay";

export const runtime = "nodejs";

type WebhookBody = {
  event?: string;
  payload?: {
    payment?: { entity?: RazorpayPayment };
    refund?: { entity?: { id: string; payment_id: string; amount: number; status?: string } };
  };
};

/**
 * Razorpay calls this directly, so orders are confirmed even when the
 * customer closes the browser before returning to our site.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-razorpay-signature") || "")) {
    return NextResponse.json({ status: "invalid_signature" }, { status: 400 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const db = await getDatabase().catch(() => null);
  // A non-2xx response makes Razorpay retry later, which is what we want here.
  if (!db) return NextResponse.json({ status: "unavailable" }, { status: 503 });

  const eventId = request.headers.get("x-razorpay-event-id") || createHash("sha256").update(rawBody).digest("hex");
  const event = body.event || "unknown";
  const payment = body.payload?.payment?.entity;

  try {
    if (!(await recordWebhookEvent(db, eventId, event))) {
      return NextResponse.json({ status: "duplicate" });
    }

    if ((event === "payment.captured" || event === "order.paid") && payment?.order_id && payment.status === "captured") {
      await confirmPaidOrder(db, {
        razorpayOrderId: payment.order_id,
        paymentId: payment.id,
        amountPaise: payment.amount,
        currency: payment.currency,
        method: payment.method,
        source: "webhook",
      });
    } else if (event === "refund.processed" && body.payload?.refund?.entity) {
      // Keeps the order in step when a refund is made in the Razorpay dashboard.
      const refund = body.payload.refund.entity;
      await applyRefund(db, { paymentId: refund.payment_id }, { id: refund.id, amountPaise: refund.amount }, "razorpay dashboard");
    } else if (event === "payment.failed" && payment?.order_id) {
      await recordPaymentFailure(db, payment.order_id, payment.error_description || "Payment failed");
    }
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay webhook processing failed", error);
    // Let Razorpay retry: forget this event id so the retry is processed.
    await db.collection<{ _id: string }>("payment_events").deleteOne({ _id: eventId }).catch(() => undefined);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
