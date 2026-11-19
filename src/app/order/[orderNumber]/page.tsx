import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusRefresher } from "@/components/order-status-refresher";
import { business } from "@/lib/business";
import { getDatabase } from "@/lib/mongodb";
import { findOrderByNumber, tokenMatches, type Order } from "@/lib/orders";
import { formatRupees, isStoreEnabled } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
};

const states: Record<Order["status"], { label: string; title: string; text: string; tone: "pending" | "ok" | "stop" }> = {
  pending_payment: { label: "PROCESSING", title: "Confirming your payment", text: "This usually takes a few seconds. This page updates by itself. If you closed the payment window, no money has been taken.", tone: "pending" },
  paid: { label: "PAYMENT VERIFIED", title: "Your order is confirmed", text: "Thank you. We will dispatch within 2 to 3 working days and email you the tracking number.", tone: "ok" },
  packed: { label: "PACKED", title: "Your order is packed", text: "It will be handed to the courier shortly.", tone: "ok" },
  shipped: { label: "SHIPPED", title: "Your order is on its way", text: "We have emailed you the courier and tracking number.", tone: "ok" },
  delivered: { label: "DELIVERED", title: "Your order was delivered", text: "We hope Aira serves your consultations well.", tone: "ok" },
  expired: { label: "NOT PAID", title: "This order was not paid", text: "The 30 minute payment window ended and no money was taken. You can place a new order at any time.", tone: "stop" },
  cancelled: { label: "CANCELLED", title: "This order was cancelled", text: "No payment is due. Contact us if you have questions.", tone: "stop" },
  refunded: { label: "REFUNDED", title: "This order was refunded", text: "Refunds usually reach your account within 5 to 7 working days.", tone: "stop" },
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ t?: string }> }) {
  if (!isStoreEnabled()) notFound();
  const { orderNumber } = await params;
  const { t } = await searchParams;
  const db = await getDatabase().catch(() => null);
  if (!db || !t) notFound();
  const order = await findOrderByNumber(db, decodeURIComponent(orderNumber));
  if (!order || !tokenMatches(t, order.access_token_hash)) notFound();

  const state = states[order.status];
  const address = order.shipping_address;
  return (
    <main id="main-content">
      <section className="section checkout-section">
        <div className="container order-layout">
          <div className={`order-state order-state-${state.tone}`} role="status" aria-live="polite">
            <span className="order-state-label">{state.label}</span>
            <h1>{state.title}</h1>
            <p>{state.text}</p>
            {order.status === "paid" && order.confirmation_email === "sent" && <p>A confirmation email is on its way to {order.customer.email}.</p>}
            {order.status === "pending_payment" && order.last_payment_error && <p className="field-error">Last attempt: {order.last_payment_error}</p>}
          </div>
          {order.status === "pending_payment" && <OrderStatusRefresher />}

          <div className="form-shell order-details">
            <p className="eyebrow">Order {order.order_number}</p>
            <dl className="checkout-totals">
              <div><dt>{order.product_name} x {order.quantity}</dt><dd>{formatRupees(order.amount_paise)}</dd></div>
              <div><dt>Delivery</dt><dd>Free</dd></div>
              <div className="muted"><dt>Includes GST</dt><dd>{formatRupees(order.gst_paise)}</dd></div>
              <div className="checkout-total"><dt>Total</dt><dd>{formatRupees(order.amount_paise)}</dd></div>
            </dl>
            <div className="order-address">
              <p className="eyebrow">Delivering to</p>
              <address>
                {order.customer.name}<br />
                {address.line1}<br />
                {address.line2 && <>{address.line2}<br /></>}
                {address.city}, {address.state} {address.pincode}
              </address>
              {order.gstin && <p className="muted">GST invoice for {order.business_name} ({order.gstin})</p>}
            </div>
            <p className="muted">Questions about this order? Email <a href={`mailto:${business.supportEmail}`}>{business.supportEmail}</a> or call {business.supportPhone} with your order number. Bookmark this page to check your order status.</p>
            <div className="button-row"><Link className="button button-secondary" href="/">Return home</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
