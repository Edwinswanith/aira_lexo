import type { Db } from "mongodb";
import { sendOrderPaidEmails } from "./order-emails";
import { markOrderPaid, setConfirmationEmail, type PaidPayment } from "./orders";

/**
 * Confirms a payment that Razorpay has reported as captured, then sends the
 * confirmation emails only for the call that actually moved the order to paid.
 */
export async function confirmPaidOrder(db: Db, payment: PaidPayment, statusUrl?: string) {
  const outcome = await markOrderPaid(db, payment);
  if (outcome.result === "paid" && outcome.order._id) {
    // The status link carries the customer's private token, which only the browser holds.
    const email = await sendOrderPaidEmails(outcome.order, statusUrl);
    await setConfirmationEmail(db, outcome.order._id, email);
  }
  return outcome;
}
