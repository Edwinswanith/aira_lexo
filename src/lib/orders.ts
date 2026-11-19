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
