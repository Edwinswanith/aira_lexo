// @vitest-environment node
import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { fakeDb } from "@/test/fake-mongo";
import {
  attachRazorpayOrder,
  availableStock,
  buildOrder,
  expireStaleOrders,
  insertOrder,
  markOrderPaid,
  newOrderNumber,
  recordRefund,
  recordWebhookEvent,
  reserveStock,
  tokenMatches,
} from "./orders";
import { verifyPaymentSignature, verifyWebhookSignature } from "./razorpay";
import { checkoutSchema, orderTotals, product, type CheckoutRequest } from "./store";

// The real driver throws MongoServerError for duplicate keys; the fake throws a plain error with code 11000.
vi.mock("mongodb", () => ({ MongoServerError: Error }));

const checkout: CheckoutRequest = {
  quantity: 2,
  fullName: "Dr Maya Rao",
  email: "maya@example.com",
  phone: "9876543210",
  addressLine1: "12 Lake View Road",
  addressLine2: "",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600119",
  gstin: "",
  businessName: "",
  acceptTerms: true,
};

function freshDb() {
  return fakeDb({ orders: ["order_number", "razorpay_order_id", "razorpay_payment_id"] }).db;
}

async function placeOrder(db: ReturnType<typeof freshDb>, razorpayOrderId = "order_test_1", now = new Date("2026-11-19T10:00:00Z")) {
  expect(await reserveStock(db, checkout.quantity)).toBe(true);
  const order = buildOrder(checkout, "secret-token-abcdef", now);
  const id = await insertOrder(db, order);
  await attachRazorpayOrder(db, id, razorpayOrderId);
  return order;
}

const payment = (overrides: Partial<Parameters<typeof markOrderPaid>[1]> = {}) => ({
  razorpayOrderId: "order_test_1",
  paymentId: "pay_test_1",
  amountPaise: product.unitPricePaise * 2,
  currency: "INR",
  method: "upi",
  source: "checkout" as const,
  ...overrides,
});

describe("pricing and validation", () => {
  it("computes GST included in the price and free delivery", () => {
    const totals = orderTotals(2);
    expect(totals.totalPaise).toBe(product.unitPricePaise * 2);
    expect(totals.gstPaise).toBe(Math.round((product.unitPricePaise * 2 * 18) / 118));
    expect(totals.shippingPaise).toBe(0);
  });

  it("normalises Indian mobile numbers and rejects invalid ones", () => {
    expect(checkoutSchema.parse({ ...checkout, phone: "+91 98765-43210" }).phone).toBe("9876543210");
    expect(checkoutSchema.parse({ ...checkout, phone: "09876543210" }).phone).toBe("9876543210");
    expect(checkoutSchema.safeParse({ ...checkout, phone: "12345" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkout, phone: "5876543210" }).success).toBe(false);
  });

  it("validates PIN code, quantity, terms and GSTIN with business name", () => {
    expect(checkoutSchema.safeParse({ ...checkout, pincode: "060011" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkout, quantity: product.maxQuantityPerOrder + 1 }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkout, acceptTerms: false }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkout, gstin: "33AABCA1234B1Z5" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...checkout, gstin: "33aabca1234b1z5", businessName: "Rao Clinic" }).data?.gstin).toBe("33AABCA1234B1Z5");
  });
});

describe("Razorpay signatures", () => {
  it("accepts only a signature made with the key secret over order_id|payment_id", () => {
    const signature = createHmac("sha256", "key_secret").update("order_1|pay_1").digest("hex");
    expect(verifyPaymentSignature("order_1", "pay_1", signature, "key_secret")).toBe(true);
    expect(verifyPaymentSignature("order_1", "pay_2", signature, "key_secret")).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", signature, "other_secret")).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "", "key_secret")).toBe(false);
  });

  it("verifies webhooks over the exact raw body", () => {
    const body = '{"event":"payment.captured"}';
    const signature = createHmac("sha256", "hook_secret").update(body).digest("hex");
    expect(verifyWebhookSignature(body, signature, "hook_secret")).toBe(true);
    expect(verifyWebhookSignature(`${body} `, signature, "hook_secret")).toBe(false);
    expect(verifyWebhookSignature(body, signature, "")).toBe(false);
  });
});

describe("orders", () => {
  it("creates readable order numbers and private access tokens", () => {
    expect(newOrderNumber(new Date("2026-11-19T10:00:00Z"))).toMatch(/^AIRA-261119-[2-9A-HJ-NP-Z]{5}$/);
    const order = buildOrder(checkout, "secret-token-abcdef");
    expect(order.access_token_hash).not.toContain("secret-token");
    expect(tokenMatches("secret-token-abcdef", order.access_token_hash)).toBe(true);
    expect(tokenMatches("wrong-token-abcdefg", order.access_token_hash)).toBe(false);
  });

  it("never sells more stock than exists", async () => {
    process.env.STORE_INITIAL_STOCK = "3";
    const db = freshDb();
    expect(await reserveStock(db, 2)).toBe(true);
    expect(await reserveStock(db, 2)).toBe(false);
    expect(await reserveStock(db, 1)).toBe(true);
    expect(await availableStock(db)).toBe(0);
    delete process.env.STORE_INITIAL_STOCK;
  });

  it("marks an order paid exactly once, from checkout and webhook alike", async () => {
    const db = freshDb();
    await placeOrder(db);
    const first = await markOrderPaid(db, payment());
    expect(first.result).toBe("paid");
    const second = await markOrderPaid(db, payment({ source: "webhook" }));
    expect(second.result).toBe("already_paid");
    if (second.result === "already_paid") expect(second.order.events.filter((event) => event.type === "paid")).toHaveLength(1);
  });

  it("refuses a payment whose amount does not match the order", async () => {
    const db = freshDb();
    await placeOrder(db);
    const outcome = await markOrderPaid(db, payment({ amountPaise: 100 }));
    expect(outcome.result).toBe("amount_mismatch");
    if (outcome.result === "amount_mismatch") {
      const stored = await db.collection("orders").findOne({ order_number: outcome.order.order_number });
      expect(stored?.status).toBe("pending_payment");
    }
  });

  it("ignores payments for unknown orders", async () => {
    const db = freshDb();
    expect((await markOrderPaid(db, payment({ razorpayOrderId: "order_missing" }))).result).toBe("unknown_order");
  });

  it("flags a second payment for an already paid order so it can be refunded", async () => {
    const db = freshDb();
    const order = await placeOrder(db);
    await markOrderPaid(db, payment());
    await markOrderPaid(db, payment({ paymentId: "pay_test_2" }));
    const stored = await db.collection("orders").findOne({ order_number: order.order_number });
    expect(stored?.needs_attention).toContain("pay_test_2");
  });

  it("expires unpaid orders after 30 minutes and returns their stock", async () => {
    process.env.STORE_INITIAL_STOCK = "5";
    const db = freshDb();
    const order = await placeOrder(db, "order_test_1", new Date("2026-11-19T10:00:00Z"));
    expect(await availableStock(db)).toBe(3);
    expect(await expireStaleOrders(db, new Date("2026-11-19T10:20:00Z"))).toBe(0);
    expect(await expireStaleOrders(db, new Date("2026-11-19T10:31:00Z"))).toBe(1);
    expect(await availableStock(db)).toBe(5);
    expect((await db.collection("orders").findOne({ order_number: order.order_number }))?.status).toBe("expired");

    // A payment that arrives late still confirms the order and takes the stock again.
    expect((await markOrderPaid(db, payment())).result).toBe("paid");
    expect(await availableStock(db)).toBe(3);
    delete process.env.STORE_INITIAL_STOCK;
  });

  it("processes each webhook event id only once", async () => {
    const db = freshDb();
    expect(await recordWebhookEvent(db, "evt_1", "payment.captured")).toBe(true);
    expect(await recordWebhookEvent(db, "evt_1", "payment.captured")).toBe(false);
  });

  it("records a full refund once, from admin or Razorpay, and restocks unshipped units", async () => {
    const db = freshDb();
    const order = await placeOrder(db);
    await markOrderPaid(db, payment());
    expect(await availableStock(db)).toBe(8);

    const first = await recordRefund(db, { paymentId: "pay_test_1" }, { id: "rfnd_1", amountPaise: order.amount_paise }, "razorpay dashboard");
    expect(first.kind).toBe("refunded");
    if (first.kind === "refunded") {
      expect(first.order.status).toBe("refunded");
      expect(first.order.refund?.id).toBe("rfnd_1");
    }
    expect(await availableStock(db)).toBe(10);

    // The admin button and the webhook can both report the same refund.
    const again = await recordRefund(db, { orderNumber: order.order_number }, { id: "rfnd_1", amountPaise: order.amount_paise }, "admin@example.com");
    expect(again.kind).toBe("already_refunded");
    expect(await availableStock(db)).toBe(10);
  });

  it("does not restock a shipped order on refund", async () => {
    const db = freshDb();
    const order = await placeOrder(db);
    await markOrderPaid(db, payment());
    await db.collection("orders").updateOne({ order_number: order.order_number }, { $set: { status: "shipped" } });
    const outcome = await recordRefund(db, { orderNumber: order.order_number }, { id: "rfnd_2", amountPaise: order.amount_paise }, "admin@example.com");
    expect(outcome.kind).toBe("refunded");
    expect(await availableStock(db)).toBe(8);
  });

  it("flags a partial refund for a person to check instead of closing the order", async () => {
    const db = freshDb();
    const order = await placeOrder(db);
    await markOrderPaid(db, payment());
    const outcome = await recordRefund(db, { paymentId: "pay_test_1" }, { id: "rfnd_3", amountPaise: Math.floor(order.amount_paise / 2) }, "razorpay dashboard");
    expect(outcome.kind).toBe("partial");
    if (outcome.kind === "partial") {
      expect(outcome.order.status).toBe("paid");
      expect(outcome.order.needs_attention).toContain("Partial refund");
    }
    const repeat = await recordRefund(db, { paymentId: "pay_test_1" }, { id: "rfnd_3", amountPaise: Math.floor(order.amount_paise / 2) }, "razorpay dashboard");
    expect(repeat.kind).toBe("partial");
    if (repeat.kind === "partial") expect(repeat.order.events.filter((event) => event.type === "partial_refund")).toHaveLength(1);
    expect(order.order_number).toBeTruthy();
  });

  it("ignores refunds for payments it does not know and orders that were never paid", async () => {
    const db = freshDb();
    expect((await recordRefund(db, { paymentId: "pay_unknown" }, { id: "rfnd_4", amountPaise: 100 }, "razorpay dashboard")).kind).toBe("not_found");
    const order = await placeOrder(db);
    expect((await recordRefund(db, { orderNumber: order.order_number }, { id: "rfnd_5", amountPaise: order.amount_paise }, "admin@example.com")).kind).toBe("not_refundable");
  });
});
