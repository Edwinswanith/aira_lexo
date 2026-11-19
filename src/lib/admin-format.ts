import type { OrderStatus } from "./orders";

export const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid, to pack",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  expired: "Not paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function formatIst(date?: Date) {
  return date ? date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
}
