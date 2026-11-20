import type { Db } from "mongodb";
import { sendOrderRefundedEmail } from "./order-emails";
import { recordRefund, setRefundEmailStatus, type RefundOutcome } from "./orders";

/** Records a refund and, the first time only, emails the customer about it. */
export async function applyRefund(
  db: Db,
  lookup: { orderNumber?: string; paymentId?: string },
  refund: { id: string; amountPaise: number },
  actor: string,
): Promise<RefundOutcome> {
  const outcome = await recordRefund(db, lookup, refund, actor);
  if (outcome.kind === "refunded") {
    await setRefundEmailStatus(db, outcome.order.order_number, await sendOrderRefundedEmail(outcome.order));
  }
  return outcome;
}
