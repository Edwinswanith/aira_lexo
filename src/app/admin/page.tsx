import { redirect } from "next/navigation";

/** /admin is a shortcut to the order desk. */
export default function AdminIndexPage() {
  redirect("/admin/orders");
}
