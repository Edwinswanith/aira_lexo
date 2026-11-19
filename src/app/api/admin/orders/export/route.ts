import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, findAdminSession } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/mongodb";
import { listOrders, type OrderStatus } from "@/lib/orders";

export const runtime = "nodejs";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  // Neutralise spreadsheet formulas and quote every cell.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const db = await getDatabase().catch(() => null);
  if (!db) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  const sessionId = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!sessionId || !(await findAdminSession(db, sessionId))) return NextResponse.json({ status: "unauthorized" }, { status: 401 });

  const status = (request.nextUrl.searchParams.get("status") || "all") as OrderStatus | "attention" | "all";
  const orders = await listOrders(db, { status, search: request.nextUrl.searchParams.get("q") || undefined, limit: 5000 });
  const header = ["Order", "Status", "Placed (UTC)", "Paid (UTC)", "Customer", "Email", "Phone", "Address", "City", "State", "PIN", "GSTIN", "Business", "Quantity", "Total (INR)", "GST included (INR)", "Payment ID", "Method", "Courier", "Tracking", "Refund ID"];
  const rows = orders.map((order) => [
    order.order_number, order.status, order.created_at?.toISOString(), order.paid_at?.toISOString(),
    order.customer.name, order.customer.email, order.customer.phone,
    [order.shipping_address.line1, order.shipping_address.line2].filter(Boolean).join(", "),
    order.shipping_address.city, order.shipping_address.state, order.shipping_address.pincode,
    order.gstin, order.business_name, order.quantity,
    (order.amount_paise / 100).toFixed(2), (order.gst_paise / 100).toFixed(2),
    order.razorpay_payment_id, order.payment_method, order.shipment?.courier, order.shipment?.tracking_number, order.refund?.id,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="aira-orders-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
