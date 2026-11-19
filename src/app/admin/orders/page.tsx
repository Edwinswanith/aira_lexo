import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { availableStock, listOrders, salesSummary, type OrderStatus } from "@/lib/orders";
import { formatIst, statusLabels } from "@/lib/admin-format";
import { formatRupees } from "@/lib/store";
import { signOut, updateStock } from "../actions";

export const dynamic = "force-dynamic";

const filters: Array<{ value: OrderStatus | "attention" | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "paid", label: "To pack" },
  { value: "packed", label: "Packed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "attention", label: "Needs attention" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "expired", label: "Not paid" },
  { value: "refunded", label: "Refunded" },
];

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; message?: string }> }) {
  const { db, admin } = await requireAdmin();
  const params = await searchParams;
  const status = (filters.find((filter) => filter.value === params.status)?.value) ?? "all";
  const [orders, summary, stock] = await Promise.all([
    listOrders(db, { status, search: params.q }),
    salesSummary(db),
    availableStock(db),
  ]);
  const exportHref = `/api/admin/orders/export?status=${encodeURIComponent(status)}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Aira order desk</p>
          <h1 className="admin-title">Orders</h1>
        </div>
        <form action={signOut} className="admin-signout"><span className="muted">{admin.email}</span><button className="button button-secondary" type="submit">Sign out</button></form>
      </header>

      {params.message && <div className="form-status" role="status">{params.message}</div>}

      <section className="admin-stats" aria-label="Sales summary">
        <div><span>Today</span><strong>{formatRupees(summary.today.revenuePaise)}</strong><small>{plural(summary.today.orders, "order")}</small></div>
        <div><span>This month</span><strong>{formatRupees(summary.month.revenuePaise)}</strong><small>{plural(summary.month.units, "unit")}</small></div>
        <div><span>All time</span><strong>{formatRupees(summary.allTime.revenuePaise)}</strong><small>{plural(summary.allTime.orders, "order")}</small></div>
        <div className={summary.toShip ? "admin-stat-alert" : ""}><span>To ship</span><strong>{summary.toShip}</strong><small>paid or packed</small></div>
        <div className={summary.attention ? "admin-stat-alert" : ""}><span>Needs attention</span><strong>{summary.attention}</strong><small>check these first</small></div>
        <form action={updateStock} className="admin-stock">
          <label htmlFor="available"><span>Units in stock</span></label>
          <div><input id="available" name="available" type="number" min={0} defaultValue={stock} /><button className="button button-secondary" type="submit">Save</button></div>
        </form>
      </section>

      <nav className="admin-filters" aria-label="Filter orders">
        {filters.map((filter) => (
          <Link key={filter.value} href={`/admin/orders?status=${filter.value}`} aria-current={filter.value === status ? "page" : undefined}>{filter.label}</Link>
        ))}
      </nav>

      <div className="admin-toolbar">
        <form className="admin-search" action="/admin/orders">
          <input type="hidden" name="status" value={status} />
          <label className="sr-only" htmlFor="q">Search orders</label>
          <input id="q" name="q" type="search" placeholder="Order number, name, email, or phone" defaultValue={params.q || ""} />
          <button className="button button-secondary" type="submit">Search</button>
        </form>
        <a className="button button-secondary" href={exportHref}>Export CSV</a>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Placed (IST)</th><th>Customer</th><th>Qty</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6} className="muted">No orders match this view.</td></tr>}
            {orders.map((order) => (
              <tr key={order.order_number}>
                <td><Link href={`/admin/orders/${encodeURIComponent(order.order_number)}`}>{order.order_number}</Link>{order.needs_attention && <span className="admin-flag" title={order.needs_attention}>Check</span>}</td>
                <td>{formatIst(order.created_at)}</td>
                <td>{order.customer.name}<br /><span className="muted">{order.shipping_address.city}</span></td>
                <td>{order.quantity}</td>
                <td>{formatRupees(order.amount_paise)}</td>
                <td><span className={`admin-status admin-status-${order.status}`}>{statusLabels[order.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
