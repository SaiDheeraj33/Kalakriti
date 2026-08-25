"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { adminFetch, adminLogin, clearAdminToken, getAdminToken } from "@/lib/admin-auth";

interface Stats {
  ordersToday: number;
  revenueMonthMinor: number;
  lowStockCount: number;
  pendingReviews: number;
  draftProducts: number;
  lowStock: { stock: number; variant: { sku: string; product: { title: string; slug: string } } }[];
  recentOrders: { number: string; status: string; totalMinor: number; customer: string; createdAt: string }[];
}

interface OrderRow {
  number: string;
  status: string;
  totalMinor: number;
  user?: { email: string } | null;
  payment?: { provider: string; status: string };
  createdAt: string;
}

const fmt = (minor: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(minor / 100);

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("admin@kalakriti.in");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => setToken(getAdminToken()), []);

  const load = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([
        adminFetch<Stats>("/admin/stats"),
        adminFetch<{ items: OrderRow[] }>("/admin/orders"),
      ]);
      setStats(s);
      setOrders(o.items);
      setError("");
    } catch {
      setError("Could not reach the API. Is it running?");
    }
  }, []);

  useEffect(() => {
    if (token) void load();
    setChecked(true);
  }, [token, load]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const ok = await adminLogin(email, password);
    if (!ok) {
      setLoginError("Invalid credentials or not an admin account");
      return;
    }
    setToken(getAdminToken());
  }

  async function advance(number: string, current: string) {
    const NEXT: Record<string, string> = {
      CONFIRMED: "PROCESSING",
      PROCESSING: "SHIPPED",
      SHIPPED: "DELIVERED",
    };
    const next = NEXT[current];
    if (!next) return;
    await adminFetch(`/admin/orders/${number}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    void load();
  }

  if (!checked) return null;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-lg">
          <p className="text-center font-display text-2xl tracking-[0.28em] font-semibold">
            KALAKRITI<span className="text-gold">.</span>
          </p>
          <p className="mt-1 text-center text-xs uppercase tracking-widest text-ink/40">Operations Console</p>

          <label className="mt-8 block text-xs uppercase tracking-widest text-ink/45">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-gold"
          />
          <label className="mt-5 block text-xs uppercase tracking-widest text-ink/45">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-ink/15 px-4 py-3 text-sm outline-none focus:border-gold"
          />
          {loginError && <p className="mt-3 text-sm text-terracotta">{loginError}</p>}
          <button
            type="submit"
            className="mt-8 w-full rounded-full bg-terracotta py-3 text-sm font-medium text-ivory transition-colors hover:bg-terracotta-dark"
          >
            Sign in
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="pl-64">
        <header className="flex h-16 items-center justify-between border-b border-ink/10 bg-ivory px-8">
          <h1 className="font-display text-2xl">Dashboard</h1>
          <button
            type="button"
            onClick={() => { clearAdminToken(); window.location.reload(); }}
            className="text-sm text-ink/50 hover:text-terracotta"
          >
            Sign out
          </button>
        </header>

        <main className="space-y-8 p-8">
          {error && <p className="rounded-xl bg-terracotta/10 p-4 text-sm text-terracotta">{error}</p>}

          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Orders today", value: stats ? String(stats.ordersToday) : "—" },
              { label: "Revenue (MTD)", value: stats ? fmt(stats.revenueMonthMinor) : "—" },
              { label: "Low stock items", value: stats ? String(stats.lowStockCount) : "—" },
              { label: "Pending reviews", value: stats ? String(stats.pendingReviews) : "—" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-widest text-ink/45">{kpi.label}</p>
                <p className="mt-3 font-display text-4xl">{kpi.value}</p>
              </div>
            ))}
          </section>

          {stats && stats.lowStock.length > 0 && (
            <section className="rounded-2xl border border-gold/30 bg-gold/5 p-6">
              <p className="font-medium">Low stock alert</p>
              <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                {stats.lowStock.map((l) => (
                  <li key={l.variant.sku}>
                    {l.variant.product.title} — {l.variant.sku}: <strong>{l.stock}</strong> left
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-ink/10 bg-white shadow-sm">
            <div className="border-b border-ink/10 px-6 py-4">
              <h2 className="font-display text-xl">Recent orders</h2>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-widest text-ink/40">
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Customer</th>
                  <th className="px-6 py-3 font-medium">Total</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.number} className="border-b border-ink/5 last:border-0">
                    <td className="px-6 py-4 font-medium">{o.number}</td>
                    <td className="px-6 py-4 text-ink/70">{o.user?.email ?? "guest"}</td>
                    <td className="px-6 py-4 text-ink/70">{fmt(o.totalMinor)}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-ink/70">{o.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {["CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status) && (
                        <button
                          type="button"
                          onClick={() => advance(o.number, o.status)}
                          className="text-xs text-emerald hover:underline"
                        >
                          Advance →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-ink/40">No orders yet</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </>
  );
}
