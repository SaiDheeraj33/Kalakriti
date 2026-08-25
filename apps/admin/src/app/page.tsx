import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Dashboard",
};

const KPIS = [
  { label: "Orders today", value: "128", delta: "+12%", positive: true },
  { label: "Revenue (MTD)", value: "₹4.2L", delta: "+8%", positive: true },
  { label: "Low stock items", value: "7", delta: "-3", positive: true },
  { label: "Pending approvals", value: "3", delta: "+2", positive: false },
];

const RECENT_ORDERS = [
  { id: "KLK-10248", customer: "A. Sharma", total: "₹18,500", status: "CONFIRMED" },
  { id: "KLK-10247", customer: "R. Iyer", total: "₹42,900", status: "SHIPPED" },
  { id: "KLK-10246", customer: "M. Kapoor", total: "₹9,250", status: "DELIVERED" },
  { id: "KLK-10245", customer: "S. Nair", total: "₹27,000", status: "PROCESSING" },
];

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-gold/15 text-gold",
  SHIPPED: "bg-emerald/15 text-emerald",
  DELIVERED: "bg-emerald/15 text-emerald",
  PROCESSING: "bg-sand text-ink/70",
};

export default function DashboardPage() {
  return (
    <>
      <Sidebar />
      <div className="pl-64">
      <header className="flex h-16 items-center justify-between border-b border-ink/10 bg-ivory px-8">
        <h1 className="font-display text-2xl">Dashboard</h1>
        <p className="text-sm text-ink/50">Sample data — wired to API in Phase 6</p>
      </header>

      <main className="space-y-8 p-8">
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm"
            >
              <p className="text-xs uppercase tracking-widest text-ink/45">{kpi.label}</p>
              <div className="mt-3 flex items-baseline justify-between">
                <p className="font-display text-4xl">{kpi.value}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    kpi.positive ? "bg-emerald/10 text-emerald" : "bg-terracotta/10 text-terracotta"
                  }`}
                >
                  {kpi.delta}
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
            <h2 className="font-display text-xl">Recent orders</h2>
            <button type="button" className="text-sm text-terracotta hover:underline">
              View all
            </button>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-widest text-ink/40">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Total</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ORDERS.map((order) => (
                <tr key={order.id} className="border-b border-ink/5 last:border-0">
                  <td className="px-6 py-4 font-medium">{order.id}</td>
                  <td className="px-6 py-4 text-ink/70">{order.customer}</td>
                  <td className="px-6 py-4 text-ink/70">{order.total}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[order.status] ?? "bg-sand text-ink/70"}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      </div>
    </>
  );
}
