import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { MongoServerError, type Db, type ObjectId } from "mongodb";
import { product, RESERVATION_MINUTES, type CheckoutRequest, orderTotals } from "./store";

export type OrderStatus = "pending_payment" | "paid" | "expired" | "packed" | "shipped" | "delivered" | "cancelled" | "refunded";

export type OrderEvent = { at: Date; type: string; detail?: string };

export type Order = {
  _id?: ObjectId;
  order_number: string;
  status: OrderStatus;
  created_at: Date;
  updated_at: Date;
  reserved_until: Date;
  paid_at?: Date;
  sku: string;
  product_name: string;
  quantity: number;
  unit_price_paise: number;
  amount_paise: number;
  gst_paise: number;
  shipping_paise: number;
  currency: "INR";
  customer: { name: string; email: string; phone: string };
  shipping_address: { line1: string; line2: string | null; city: string; state: string; pincode: string; country: "India" };
  gstin: string | null;
  business_name: string | null;
  access_token_hash: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_method?: string;
  last_payment_error?: string;
  needs_attention?: string;
  confirmation_email?: "sent" | "failed" | "not_configured";
  shipment?: { courier: string; tracking_number: string; tracking_url: string | null; shipped_at: Date };
  delivered_at?: Date;
  refund?: { id: string; amount_paise: number; refunded_at: Date };
  refund_email?: "sent" | "failed" | "not_configured";
  internal_note?: string;
  events: OrderEvent[];
};

type Inventory = { _id: string; available: number; updated_at: Date };
type RateLimitEntry = { key: string; created_at: Date };

const orders = (db: Db) => db.collection<Order>("orders");
const inventory = (db: Db) => db.collection<Inventory>("inventory");

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenMatches(token: string, storedHash: string) {
  const a = Buffer.from(hashToken(token), "utf8");
  const b = Buffer.from(storedHash, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Readable, hard to guess: AIRA-261119-7KQ3M. Avoids 0/O and 1/I. */
export function newOrderNumber(now = new Date()) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(5);
  const suffix = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  const date = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `AIRA-${date}-${suffix}`;
}

export async function allowOrderAttempt(db: Db, key: string, now = new Date()) {
  const limits = db.collection<RateLimitEntry>("order_rate_limits");
  await limits.insertOne({ key, created_at: now });
  const recent = await limits.countDocuments({ key, created_at: { $gt: new Date(now.getTime() - 15 * 60 * 1000) } });
  return recent <= 10;
}

function initialStock() {
  const configured = Number.parseInt(process.env.STORE_INITIAL_STOCK || "", 10);
  return Number.isFinite(configured) && configured >= 0 ? configured : 10;
}

/** Atomically takes `quantity` units if available. Returns false when there is not enough stock. */
export async function reserveStock(db: Db, quantity: number) {
  try {
    await inventory(db).updateOne(
      { _id: product.sku },
      { $setOnInsert: { available: initialStock(), updated_at: new Date() } },
      { upsert: true },
    );
  } catch (error) {
    // Two first-ever requests can race to create the record; the loser can continue.
    if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
  }
  const taken = await inventory(db).findOneAndUpdate(
    { _id: product.sku, available: { $gte: quantity } },
    { $inc: { available: -quantity }, $set: { updated_at: new Date() } },
  );
  return taken !== null;
}

export async function releaseStock(db: Db, quantity: number) {
  await inventory(db).updateOne({ _id: product.sku }, { $inc: { available: quantity }, $set: { updated_at: new Date() } });
}

export async function availableStock(db: Db) {
  const record = await inventory(db).findOne({ _id: product.sku });
  return record ? record.available : initialStock();
}

export function buildOrder(input: CheckoutRequest, accessToken: string, now = new Date()): Order {
  const totals = orderTotals(input.quantity);
  return {
    order_number: newOrderNumber(now),
    status: "pending_payment",
    created_at: now,
    updated_at: now,
    reserved_until: new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000),
    sku: product.sku,
    product_name: product.name,
    quantity: input.quantity,
    unit_price_paise: totals.unitPricePaise,
    amount_paise: totals.totalPaise,
    gst_paise: totals.gstPaise,
    shipping_paise: totals.shippingPaise,
    currency: "INR",
    customer: { name: input.fullName, email: input.email, phone: input.phone },
    shipping_address: { line1: input.addressLine1, line2: input.addressLine2 || null, city: input.city, state: input.state, pincode: input.pincode, country: "India" },
    gstin: input.gstin || null,
    business_name: input.gstin ? input.businessName || null : null,
    access_token_hash: hashToken(accessToken),
    events: [{ at: now, type: "created" }],
  };
}

export async function insertOrder(db: Db, order: Order) {
  const result = await orders(db).insertOne(order);
  return result.insertedId;
}

export async function attachRazorpayOrder(db: Db, id: ObjectId, razorpayOrderId: string) {
  await orders(db).updateOne(
    { _id: id },
    { $set: { razorpay_order_id: razorpayOrderId, updated_at: new Date() }, $push: { events: { at: new Date(), type: "razorpay_order_created", detail: razorpayOrderId } } },
  );
}

/** Used when the Razorpay order could not be created: frees the stock and closes the order. */
export async function abandonOrder(db: Db, id: ObjectId, reason: string) {
  const closed = await orders(db).findOneAndUpdate(
    { _id: id, status: "pending_payment" },
    { $set: { status: "cancelled", updated_at: new Date() }, $push: { events: { at: new Date(), type: "abandoned", detail: reason } } },
  );
  if (closed) await releaseStock(db, closed.quantity);
}

export function findOrderByNumber(db: Db, orderNumber: string) {
  return orders(db).findOne({ order_number: orderNumber });
}

export function findOrderByRazorpayOrderId(db: Db, razorpayOrderId: string) {
  return orders(db).findOne({ razorpay_order_id: razorpayOrderId });
}

export type PaidPayment = { razorpayOrderId: string; paymentId: string; amountPaise: number; currency: string; method?: string; source: "checkout" | "webhook" };

export type MarkPaidResult =
  | { result: "paid"; order: Order }
  | { result: "already_paid"; order: Order }
  | { result: "unknown_order" }
  | { result: "amount_mismatch"; order: Order };

/**
 * Marks an order paid exactly once. Safe to call from both the checkout
 * verification and the webhook, in any order, any number of times.
 */
export async function markOrderPaid(db: Db, payment: PaidPayment, now = new Date()): Promise<MarkPaidResult> {
  const order = await findOrderByRazorpayOrderId(db, payment.razorpayOrderId);
  if (!order || !order._id) return { result: "unknown_order" };

  if (payment.amountPaise !== order.amount_paise || payment.currency !== order.currency) {
    await orders(db).updateOne(
      { _id: order._id },
      { $set: { needs_attention: "Payment amount did not match the order", updated_at: now }, $push: { events: { at: now, type: "amount_mismatch", detail: `${payment.paymentId}: ${payment.amountPaise} ${payment.currency}` } } },
    );
    return { result: "amount_mismatch", order };
  }

  let before: Order | null;
  try {
    before = await orders(db).findOneAndUpdate(
      { _id: order._id, status: { $in: ["pending_payment", "expired"] } },
      {
        $set: { status: "paid", paid_at: now, razorpay_payment_id: payment.paymentId, payment_method: payment.method, updated_at: now },
        $unset: { last_payment_error: "" },
        $push: { events: { at: now, type: "paid", detail: `${payment.paymentId} via ${payment.source}` } },
      },
      { returnDocument: "before" },
    );
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      // This payment id already confirmed a different order.
      await orders(db).updateOne({ _id: order._id }, { $set: { needs_attention: `Payment ${payment.paymentId} is linked to another order` } });
      return { result: "amount_mismatch", order };
    }
    throw error;
  }

  if (before) {
    // An expired order released its stock; a late payment takes it again.
    if (before.status === "expired") {
      await inventory(db).updateOne({ _id: product.sku }, { $inc: { available: -before.quantity }, $set: { updated_at: now } });
    }
    const paid = (await orders(db).findOne({ _id: order._id })) as Order;
    return { result: "paid", order: paid };
  }

  const current = (await orders(db).findOne({ _id: order._id })) as Order;
  if (current.razorpay_payment_id && current.razorpay_payment_id !== payment.paymentId) {
    // The customer paid twice for one order. Flag it so the team refunds the extra payment.
    await orders(db).updateOne(
      { _id: order._id, needs_attention: { $exists: false } },
      { $set: { needs_attention: `Second payment ${payment.paymentId} received: refund it` }, $push: { events: { at: now, type: "duplicate_payment", detail: payment.paymentId } } },
    );
  }
  return { result: "already_paid", order: current };
}

export async function recordPaymentFailure(db: Db, razorpayOrderId: string, detail: string, now = new Date()) {
  await orders(db).updateOne(
    { razorpay_order_id: razorpayOrderId, status: "pending_payment" },
    { $set: { last_payment_error: detail.slice(0, 300), updated_at: now }, $push: { events: { at: now, type: "payment_failed", detail: detail.slice(0, 300) } } },
  );
}

export async function setConfirmationEmail(db: Db, id: ObjectId, status: NonNullable<Order["confirmation_email"]>) {
  await orders(db).updateOne({ _id: id }, { $set: { confirmation_email: status } });
}

/** Closes unpaid orders past their reservation and returns their stock. */
export async function expireStaleOrders(db: Db, now = new Date()) {
  const stale = await orders(db).find({ status: "pending_payment", reserved_until: { $lt: now } }).limit(50).toArray();
  let expired = 0;
  for (const order of stale) {
    const closed = await orders(db).findOneAndUpdate(
      { _id: order._id, status: "pending_payment" },
      { $set: { status: "expired", updated_at: now }, $push: { events: { at: now, type: "expired" } } },
    );
    if (closed) {
      await releaseStock(db, closed.quantity);
      expired += 1;
    }
  }
  return expired;
}

/** Records a webhook event id. Returns false if it was already processed. */
export async function recordWebhookEvent(db: Db, eventId: string, event: string, now = new Date()) {
  try {
    await db.collection<{ _id: string; event: string; received_at: Date }>("payment_events").insertOne({ _id: eventId, event, received_at: now });
    return true;
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) return false;
    throw error;
  }
}

/** Statuses that count as a sale in reports. */
export const SOLD_STATUSES: OrderStatus[] = ["paid", "packed", "shipped", "delivered"];

/**
 * Moves an order from one of `from` to `to`, recording who did it. Returns the
 * updated order, or null if the order was not in an allowed status.
 */
export async function transitionOrder(
  db: Db,
  orderNumber: string,
  from: OrderStatus[],
  to: OrderStatus,
  actor: string,
  set: Partial<Order> = {},
  now = new Date(),
) {
  return orders(db).findOneAndUpdate(
    { order_number: orderNumber, status: { $in: from } },
    { $set: { ...set, status: to, updated_at: now }, $push: { events: { at: now, type: to, detail: actor } } },
    { returnDocument: "after" },
  );
}

export async function addOrderNote(db: Db, orderNumber: string, note: string, actor: string, now = new Date()) {
  await orders(db).updateOne(
    { order_number: orderNumber },
    { $set: { internal_note: note.slice(0, 1000), updated_at: now }, $push: { events: { at: now, type: "note", detail: actor } } },
  );
}

export async function clearAttention(db: Db, orderNumber: string, actor: string, now = new Date()) {
  await orders(db).updateOne(
    { order_number: orderNumber },
    { $unset: { needs_attention: "" }, $push: { events: { at: now, type: "attention_cleared", detail: actor } } },
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listOrders(db: Db, options: { status?: OrderStatus | "attention" | "all"; search?: string; limit?: number } = {}) {
  const filter: Record<string, unknown> = {};
  if (options.status === "attention") filter.needs_attention = { $exists: true };
  else if (options.status && options.status !== "all") filter.status = options.status;
  const search = options.search?.trim();
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ order_number: pattern }, { "customer.name": pattern }, { "customer.email": pattern }, { "customer.phone": pattern }];
  }
  return orders(db).find(filter).sort({ created_at: -1 }).limit(options.limit ?? 200).toArray();
}

export async function salesSummary(db: Db, now = new Date()) {
  // Day and month boundaries in India Standard Time (UTC+5:30).
  const istOffset = 330 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  const dayStart = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - istOffset);
  const monthStart = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - istOffset);
  const sold = await orders(db).find({ status: { $in: SOLD_STATUSES } }, { projection: { amount_paise: 1, quantity: 1, paid_at: 1 } }).toArray();
  const sum = (since?: Date) => sold
    .filter((order) => !since || (order.paid_at && order.paid_at >= since))
    .reduce((total, order) => ({ orders: total.orders + 1, units: total.units + order.quantity, revenuePaise: total.revenuePaise + order.amount_paise }), { orders: 0, units: 0, revenuePaise: 0 });
  const toShip = await orders(db).countDocuments({ status: { $in: ["paid", "packed"] } });
  const attention = await orders(db).countDocuments({ needs_attention: { $exists: true } });
  return { today: sum(dayStart), month: sum(monthStart), allTime: sum(), toShip, attention };
}

export async function setStock(db: Db, available: number, now = new Date()) {
  await inventory(db).updateOne({ _id: product.sku }, { $set: { available, updated_at: now } }, { upsert: true });
}

export type RefundOutcome =
  | { kind: "refunded"; order: Order; previousStatus: OrderStatus }
  | { kind: "already_refunded"; order: Order }
  | { kind: "partial"; order: Order }
  | { kind: "not_refundable"; order: Order }
  | { kind: "not_found" };

/**
 * Records a refund against an order, whether it started in our admin or in the
 * Razorpay dashboard. Safe to call twice for the same refund: only the first call
 * changes the order. A full refund marks the order refunded and returns unshipped
 * units to stock; a partial refund flags the order for a person to check.
 */
export async function recordRefund(
  db: Db,
  lookup: { orderNumber?: string; paymentId?: string },
  refund: { id: string; amountPaise: number },
  actor: string,
  now = new Date(),
): Promise<RefundOutcome> {
  const filter = lookup.orderNumber ? { order_number: lookup.orderNumber } : { razorpay_payment_id: lookup.paymentId };
  if (!lookup.orderNumber && !lookup.paymentId) return { kind: "not_found" };
  const order = await orders(db).findOne(filter);
  if (!order) return { kind: "not_found" };
  if (order.status === "refunded") return { kind: "already_refunded", order };

  const refundable: OrderStatus[] = ["paid", "packed", "shipped", "delivered"];
  if (!refundable.includes(order.status)) return { kind: "not_refundable", order };

  if (refund.amountPaise < order.amount_paise) {
    // Razorpay can resend the same refund event; record each partial refund once.
    if (order.events.some((event) => event.type === "partial_refund" && event.detail === refund.id)) return { kind: "partial", order };
    const updated = await orders(db).findOneAndUpdate(
      { _id: order._id },
      {
        $set: { needs_attention: `Partial refund ${refund.id} of Rs ${(refund.amountPaise / 100).toFixed(2)} made in Razorpay: check this order`, updated_at: now },
        $push: { events: { at: now, type: "partial_refund", detail: refund.id } },
      },
      { returnDocument: "after" },
    );
    return { kind: "partial", order: updated || order };
  }

  const previousStatus = order.status;
  const updated = await orders(db).findOneAndUpdate(
    { _id: order._id, status: previousStatus },
    {
      $set: { status: "refunded", refund: { id: refund.id, amount_paise: refund.amountPaise, refunded_at: now }, updated_at: now },
      $push: { events: { at: now, type: "refunded", detail: actor } },
    },
    { returnDocument: "after" },
  );
  if (!updated) {
    // Someone else changed the order at the same moment; report what is there now.
    const current = await orders(db).findOne({ _id: order._id });
    return current?.status === "refunded" ? { kind: "already_refunded", order: current } : { kind: "not_refundable", order: current || order };
  }
  // Units that never left us go back into stock. Returned items are restocked by hand.
  if (previousStatus === "paid" || previousStatus === "packed") await releaseStock(db, order.quantity);
  return { kind: "refunded", order: updated, previousStatus };
}

export async function setRefundEmailStatus(db: Db, orderNumber: string, status: NonNullable<Order["refund_email"]>) {
  await orders(db).updateOne({ order_number: orderNumber }, { $set: { refund_email: status } });
}
