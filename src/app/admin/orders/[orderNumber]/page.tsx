import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { findOrderByNumber } from "@/lib/orders";
import { formatRupees } from "@/lib/store";
import { refundOrder, updateOrderStatus } from "../../actions";
import { formatIst, statusLabels } from "@/lib/admin-format";

export const dynamic = "force-dynamic";

export default async function AdminOrderPage({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<{ message?: string }> }) {
  const { db } = await requireAdmin();
  const { orderNumber } = await params;
  const { message } = await searchParams;
  const order = await findOrderByNumber(db, decodeURIComponent(orderNumber));
  if (!order) notFound();
  const address = order.shipping_address;
  const refundable = Boolean(order.razorpay_payment_id) && ["paid", "packed", "shipped", "delivered"].includes(order.status);
  const hidden = <input type="hidden" name="orderNumber" value={order.order_number} />;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow"><Link href="/admin/orders">All orders</Link></p>
          <h1 className="admin-title">{order.order_number}</h1>
          <span className={`admin-status admin-status-${order.status}`}>{statusLabels[order.status]}</span>
        </div>
      </header>

      {message && <div className="form-status" role="status">{message}</div>}
      {order.needs_attention && (
        <div className="form-status error" role="alert">
          <strong>Needs attention:</strong> {order.needs_attention}
          <form action={updateOrderStatus}>{hidden}<input type="hidden" name="action" value="clear_attention" /><button className="button button-secondary" type="submit">Mark as handled</button></form>
        </div>
      )}

      <div className="admin-detail">
        <section className="form-shell admin-card">
          <h2>Next step</h2>
          {order.status === "paid" && (
            <form action={updateOrderStatus}>{hidden}<input type="hidden" name="action" value="pack" /><button className="button button-violet" type="submit">Mark packed</button></form>
          )}
          {(order.status === "paid" || order.status === "packed") && (
            <form action={updateOrderStatus} className="admin-ship-form">
              {hidden}<input type="hidden" name="action" value="ship" />
              <div className="field"><label htmlFor="courier">Courier</label><input id="courier" name="courier" placeholder="e.g. Delhivery, Blue Dart" required /></div>
              <div className="field"><label htmlFor="trackingNumber">Tracking number</label><input id="trackingNumber" name="trackingNumber" required /></div>
              <div className="field"><label htmlFor="trackingUrl">Tracking link, optional</label><input id="trackingUrl" name="trackingUrl" type="url" placeholder="https://" /></div>
              <button className="button button-violet" type="submit">Mark shipped and email customer</button>
            </form>
          )}
          {order.status === "shipped" && (
            <>
              <p>Shipped {formatIst(order.shipment?.shipped_at)} with {order.shipment?.courier}, tracking {order.shipment?.tracking_number}.</p>
              <form action={updateOrderStatus}>{hidden}<input type="hidden" name="action" value="deliver" /><button className="button button-violet" type="submit">Mark delivered</button></form>
            </>
          )}
          {order.status === "delivered" && <p>Delivered {formatIst(order.delivered_at)}. Nothing more to do.</p>}
          {order.status === "pending_payment" && <p className="muted">The customer has not finished paying. This order expires 30 minutes after it was placed.</p>}
          {(order.status === "expired" || order.status === "cancelled") && <p className="muted">No payment was taken. Nothing to do.</p>}
          {order.status === "refunded" && <p>Refunded {formatRupees(order.refund?.amount_paise || 0)} on {formatIst(order.refund?.refunded_at)} ({order.refund?.id}).</p>}

          {refundable && (
            <details className="admin-refund">
              <summary>Cancel and refund this order</summary>
              <form action={refundOrder}>
                {hidden}
                <p className="muted">Refunds the full {formatRupees(order.amount_paise)} through Razorpay. {order.status === "shipped" || order.status === "delivered" ? "Stock is not changed: restock by hand when the item comes back." : "The units go back into stock."}</p>
                <label className="checkbox-row" htmlFor="confirm"><input id="confirm" name="confirm" type="checkbox" required /><span>I confirm this refund. It cannot be undone.</span></label>
                <button className="button admin-danger" type="submit">Refund {formatRupees(order.amount_paise)}</button>
              </form>
            </details>
          )}
        </section>

        <section className="form-shell admin-card">
          <h2>Customer and delivery</h2>
          <p><strong>{order.customer.name}</strong><br /><a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><br /><a href={`tel:+91${order.customer.phone}`}>+91 {order.customer.phone}</a></p>
          <address>{address.line1}<br />{address.line2 && <>{address.line2}<br /></>}{address.city}, {address.state} {address.pincode}</address>
          {order.gstin && <p>GST invoice: <strong>{order.business_name}</strong>, GSTIN {order.gstin}</p>}
        </section>

        <section className="form-shell admin-card">
          <h2>Payment</h2>
          <dl className="checkout-totals">
            <div><dt>{order.product_name} x {order.quantity}</dt><dd>{formatRupees(order.amount_paise)}</dd></div>
            <div className="muted"><dt>Includes GST</dt><dd>{formatRupees(order.gst_paise)}</dd></div>
            <div><dt>Paid</dt><dd>{formatIst(order.paid_at) || "Not yet"}</dd></div>
            <div><dt>Method</dt><dd>{order.payment_method || "None"}</dd></div>
            <div><dt>Razorpay payment</dt><dd>{order.razorpay_payment_id || "None"}</dd></div>
            <div><dt>Confirmation email</dt><dd>{order.confirmation_email || "Not sent"}</dd></div>
          </dl>
        </section>

        <section className="form-shell admin-card">
          <h2>Team note</h2>
          <form action={updateOrderStatus}>
            {hidden}<input type="hidden" name="action" value="note" />
            <div className="field"><label className="sr-only" htmlFor="note">Note</label><textarea id="note" name="note" maxLength={1000} defaultValue={order.internal_note || ""} placeholder="Visible to the team only" /></div>
            <button className="button button-secondary" type="submit">Save note</button>
          </form>
          <h2>History</h2>
          <ol className="admin-history">
            {[...order.events].reverse().map((event, index) => (
              <li key={index}><span>{formatIst(event.at)}</span> {event.type.replace(/_/g, " ")}{event.detail ? `: ${event.detail}` : ""}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
