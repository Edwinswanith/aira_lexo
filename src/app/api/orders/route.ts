import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { abandonOrder, allowOrderAttempt, attachRazorpayOrder, buildOrder, expireStaleOrders, insertOrder, reserveStock } from "@/lib/orders";
import { hashNetworkIdentifier, toFieldErrors } from "@/lib/pilot";
import { createRazorpayOrder, isRazorpayConfigured, razorpayKeyId } from "@/lib/razorpay";
import { checkoutSchema, isStoreEnabled, product } from "@/lib/store";

export const runtime = "nodejs";

function networkIdentifier(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

export async function POST(request: NextRequest) {
  if (!isStoreEnabled()) return NextResponse.json({ status: "not_found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid", errors: { form: "Submit a valid order" } }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ status: "invalid", errors: toFieldErrors(parsed.error) }, { status: 400 });
  }

  if (!isRazorpayConfigured()) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  const db = await getDatabase().catch(() => null);
  if (!db) return NextResponse.json({ status: "unavailable" }, { status: 503 });

  try {
    if (!(await allowOrderAttempt(db, hashNetworkIdentifier(networkIdentifier(request))))) {
      return NextResponse.json({ status: "rate_limited" }, { status: 429 });
    }

    await expireStaleOrders(db);
    if (!(await reserveStock(db, parsed.data.quantity))) {
      return NextResponse.json({ status: "out_of_stock" }, { status: 409 });
    }

    const accessToken = randomBytes(24).toString("base64url");
    const order = buildOrder(parsed.data, accessToken);
    const id = await insertOrder(db, order);

    let razorpayOrderId: string;
    try {
      const razorpayOrder = await createRazorpayOrder({
        amountPaise: order.amount_paise,
        receipt: order.order_number,
        notes: { order_number: order.order_number, sku: product.sku, quantity: String(order.quantity) },
      });
      razorpayOrderId = razorpayOrder.id;
    } catch (error) {
      console.error("Razorpay order creation failed", error);
      await abandonOrder(db, id, "razorpay_order_failed");
      return NextResponse.json({ status: "unavailable" }, { status: 502 });
    }
    await attachRazorpayOrder(db, id, razorpayOrderId);

    return NextResponse.json({
      status: "created",
      orderNumber: order.order_number,
      accessToken,
      razorpay: { keyId: razorpayKeyId(), orderId: razorpayOrderId, amount: order.amount_paise, currency: order.currency },
      prefill: { name: order.customer.name, email: order.customer.email, contact: `+91${order.customer.phone}` },
    }, { status: 201 });
  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json({ status: "unavailable" }, { status: 500 });
  }
}
