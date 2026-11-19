import { Resend } from "resend";
import { business } from "./business";
import type { Order } from "./orders";
import { formatRupees } from "./store";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

/** Sends the customer confirmation and the team alert for a newly paid order. */
export async function sendOrderPaidEmails(order: Order, statusUrl?: string): Promise<NonNullable<Order["confirmation_email"]>> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return "not_configured";

  const resend = new Resend(apiKey);
  const teamEmail = process.env.ORDER_NOTIFICATION_EMAIL || process.env.PILOT_NOTIFICATION_EMAIL;
  const name = escapeHtml(order.customer.name);
  const number = escapeHtml(order.order_number);
  const address = [order.shipping_address.line1, order.shipping_address.line2, `${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.pincode}`]
    .filter(Boolean).map((line) => escapeHtml(String(line))).join("<br>");
  const total = formatRupees(order.amount_paise);

  try {
    const sends = [
      resend.emails.send({
        from: "Aira Orders <orders@airalexo.in>",
        to: order.customer.email,
        replyTo: business.supportEmail,
        subject: `Order confirmed: ${order.order_number}`,
        html: `<p>Hello ${name},</p><p>Thank you for your order. Your payment of <strong>${total}</strong> is confirmed.</p><p><strong>Order:</strong> ${number}<br><strong>Item:</strong> ${escapeHtml(order.product_name)} x ${order.quantity}<br><strong>Delivery address:</strong><br>${address}</p><p>We dispatch within 2 to 3 working days and will email your tracking number.${statusUrl ? ` You can check your order at any time: <a href="${statusUrl}">view order status</a>.` : ""}</p><p>Questions? Reply to this email or call ${escapeHtml(business.supportPhone)}.</p><p>${escapeHtml(business.legalName)}</p>`,
      }),
    ];
    if (teamEmail) {
      sends.push(resend.emails.send({
        from: "Aira Orders <orders@airalexo.in>",
        to: teamEmail,
        subject: `New paid order ${order.order_number}: ${total}`,
        html: `<p>A new order has been paid.</p><p><strong>Order:</strong> ${number}<br><strong>Customer:</strong> ${name}, ${escapeHtml(order.customer.email)}, ${escapeHtml(order.customer.phone)}<br><strong>Quantity:</strong> ${order.quantity}<br><strong>Total:</strong> ${total}<br><strong>Payment:</strong> ${escapeHtml(order.razorpay_payment_id || "")}<br><strong>GSTIN:</strong> ${escapeHtml(order.gstin || "none")}</p><p><strong>Ship to:</strong><br>${address}</p>`,
      }));
    }
    const results = await Promise.all(sends);
    return results.every((result) => !result.error) ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

/** Tells the customer their order has shipped, with the tracking number. */
export async function sendOrderShippedEmail(order: Order) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !order.shipment) return false;
  const tracking = order.shipment.tracking_url
    ? `<a href="${escapeHtml(order.shipment.tracking_url)}">${escapeHtml(order.shipment.tracking_number)}</a>`
    : escapeHtml(order.shipment.tracking_number);
  try {
    const result = await new Resend(apiKey).emails.send({
      from: "Aira Orders <orders@airalexo.in>",
      to: order.customer.email,
      replyTo: business.supportEmail,
      subject: `Your Aira order ${order.order_number} has shipped`,
      html: `<p>Hello ${escapeHtml(order.customer.name)},</p><p>Your order <strong>${escapeHtml(order.order_number)}</strong> is on its way.</p><p><strong>Courier:</strong> ${escapeHtml(order.shipment.courier)}<br><strong>Tracking number:</strong> ${tracking}</p><p>Delivery usually takes 3 to 7 working days. Questions? Reply to this email or call ${escapeHtml(business.supportPhone)}.</p><p>${escapeHtml(business.legalName)}</p>`,
    });
    return !result.error;
  } catch {
    return false;
  }
}

/** Sends a one-time admin sign-in link. */
export async function sendAdminLoginEmail(email: string, link: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set for this deployment");
    return false;
  }
  try {
    const result = await new Resend(apiKey).emails.send({
      from: "Aira Admin <admin@airalexo.in>",
      to: email,
      subject: "Your Aira order desk sign-in link",
      html: `<p>Use this link to sign in to the Aira order desk. It works once and expires in 15 minutes.</p><p><a href="${escapeHtml(link)}">Sign in to the order desk</a></p><p>If you did not ask to sign in, ignore this email.</p>`,
    });
    if (result.error) console.error("Resend rejected the admin sign-in email", result.error);
    return !result.error;
  } catch {
    return false;
  }
}
