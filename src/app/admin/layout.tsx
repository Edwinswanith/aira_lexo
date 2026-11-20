import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order desk",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <main id="main-content" className="admin-main"><div className="container">{children}</div></main>;
}
