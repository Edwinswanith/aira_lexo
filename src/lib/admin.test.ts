// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "@/test/fake-mongo";
import { createLoginToken, findAdminSession, isAdminEmail, redeemLoginToken } from "./admin-auth";
import { attachRazorpayOrder, buildOrder, insertOrder, markOrderPaid, transitionOrder } from "./orders";
import { product, type CheckoutRequest } from "./store";

vi.mock("mongodb", () => ({ MongoServerError: Error }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

describe("admin sign-in", () => {
  beforeEach(() => { process.env.ADMIN_EMAILS = "edwin@airalexo.in, Team@Airalexo.in"; });
  afterEach(() => { delete process.env.ADMIN_EMAILS; });

  it("allows only listed emails, ignoring case and spaces", () => {
    expect(isAdminEmail("EDWIN@airalexo.in")).toBe(true);
    expect(isAdminEmail("team@airalexo.in")).toBe(true);
    expect(isAdminEmail("someone@example.com")).toBe(false);
  });

  it("uses each sign-in link once and starts a session", async () => {
    const { db } = fakeDb();
    const now = new Date("2026-11-19T10:00:00Z");
    const token = await createLoginToken(db, "edwin@airalexo.in", now);
    const session = await redeemLoginToken(db, token, now);
    expect(session).not.toBeNull();
    expect(await findAdminSession(db, session!.sessionId, now)).toEqual({ email: "edwin@airalexo.in" });
    expect(await redeemLoginToken(db, token, now)).toBeNull();
  });

  it("rejects expired links and expired sessions", async () => {
    const { db } = fakeDb();
    const now = new Date("2026-11-19T10:00:00Z");
    const token = await createLoginToken(db, "edwin@airalexo.in", now);
    expect(await redeemLoginToken(db, token, new Date("2026-11-19T10:16:00Z"))).toBeNull();

    const fresh = await createLoginToken(db, "edwin@airalexo.in", now);
    const session = await redeemLoginToken(db, fresh, now);
    expect(await findAdminSession(db, session!.sessionId, new Date("2026-11-27T10:00:00Z"))).toBeNull();
  });

  it("ends access when an email is removed from the list", async () => {
    const { db } = fakeDb();
    const now = new Date();
    const session = await redeemLoginToken(db, await createLoginToken(db, "team@airalexo.in", now), now);
    process.env.ADMIN_EMAILS = "edwin@airalexo.in";
    expect(await findAdminSession(db, session!.sessionId, now)).toBeNull();
  });
});

describe("order status changes", () => {
  const checkout: CheckoutRequest = {
    quantity: 1, fullName: "Dr Maya Rao", email: "maya@example.com", phone: "9876543210",
    addressLine1: "12 Lake View Road", addressLine2: "", city: "Chennai", state: "Tamil Nadu", pincode: "600119",
    gstin: "", businessName: "", acceptTerms: true,
  };

  it("follows paid, packed, shipped, delivered and refuses skipping back", async () => {
    const { db } = fakeDb({ orders: ["order_number", "razorpay_order_id", "razorpay_payment_id"] });
    const order = buildOrder(checkout, "secret-token-abcdef");
    const id = await insertOrder(db, order);
    await attachRazorpayOrder(db, id, "order_1");

    expect(await transitionOrder(db, order.order_number, ["paid"], "packed", "edwin")).toBeNull();
    await markOrderPaid(db, { razorpayOrderId: "order_1", paymentId: "pay_1", amountPaise: product.unitPricePaise, currency: "INR", source: "checkout" });

    expect((await transitionOrder(db, order.order_number, ["paid"], "packed", "edwin"))?.status).toBe("packed");
    const shipped = await transitionOrder(db, order.order_number, ["paid", "packed"], "shipped", "edwin", {
      shipment: { courier: "Delhivery", tracking_number: "DL123", tracking_url: null, shipped_at: new Date() },
    });
    expect(shipped?.shipment?.tracking_number).toBe("DL123");
    expect(await transitionOrder(db, order.order_number, ["paid"], "packed", "edwin")).toBeNull();
    expect((await transitionOrder(db, order.order_number, ["shipped"], "delivered", "edwin"))?.status).toBe("delivered");
  });
});
