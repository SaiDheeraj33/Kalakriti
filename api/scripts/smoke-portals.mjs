const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:4000/api/v1";

let failures = 0;
function check(name, cond, detail = "") {
  if (!cond) failures += 1;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
}

async function api(path, options = {}, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...headers },
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function main() {
  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@kalakriti.in", password: "Admin@Kalakriti1" }),
  });
  const admin = { Authorization: `Bearer ${adminLogin.data.accessToken}` };
  check("admin login", adminLogin.status === 200);

  const statsAnon = await api("/admin/stats", {}, {});
  check("anonymous blocked from /admin/stats", statsAnon.status === 401, `got ${statsAnon.status}`);

  const buyerReg = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: `portal.${Date.now()}@kalakriti.test`,
      password: "Portal#Pass1",
      name: "Weaver Hopeful",
    }),
  });
  const buyerAuth = { Authorization: `Bearer ${buyerReg.data.accessToken}` };

  const stats = await api("/admin/stats", {}, admin);
  check("stats shape complete",
    stats.status === 200 &&
    typeof stats.data.ordersToday === "number" &&
    typeof stats.data.revenueMonthMinor === "number" &&
    Array.isArray(stats.data.recentOrders),
    `revenueMTD=${stats.data.revenueMonthMinor} ordersToday=${stats.data.ordersToday}`);

  check("revenue reflects earlier purchases", (stats.data.revenueMonthMinor ?? 0) > 0,
    String(stats.data.revenueMonthMinor));

  const orders = await api("/admin/orders", {}, admin);
  check("admin orders list paginated shape",
    orders.status === 200 && Array.isArray(orders.data.items) && typeof orders.data.total === "number");

  const target = orders.data.items.find((o) => o.status === "CONFIRMED");
  if (target) {
    const bad = await api(`/admin/orders/${target.number}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "DELIVERED" }),
    }, admin);
    check("illegal transition rejected", bad.status === 400);

    const good = await api(`/admin/orders/${target.number}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "PROCESSING" }),
    }, admin);
    check("CONFIRMED -> PROCESSING ok", good.status === 200 && good.data.status === "PROCESSING");

    const customerTry = await api(`/admin/orders/${target.number}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "SHIPPED" }),
    }, buyerAuth);
    check("customer cannot transition orders", customerTry.status === 403);
  } else {
    check("a CONFIRMED order exists to exercise transitions", false);
  }

  const apply = await api("/artisans/apply", {
    method: "POST",
    body: JSON.stringify({
      displayName: "Sita Devi",
      crafts: ["Madhubani painting"],
      bio: "Paints epics in natural pigments.",
      state: "Bihar",
    }),
  }, buyerAuth);
  check("artisan application created unverified", apply.status === 201 && apply.data.verified === false);

  const dupApply = await api("/artisans/apply", {
    method: "POST",
    body: JSON.stringify({ displayName: "Again", crafts: ["x"] }),
  }, buyerAuth);
  check("duplicate application blocked", dupApply.status === 403);

  const mine = await api("/artisans/me", {}, buyerAuth);
  check("applicant sees own profile + empty products",
    mine.status === 200 && Array.isArray(mine.data.products));

  const verify = await api(`/artisans/${apply.data.id}/verify`, { method: "PATCH" }, admin);
  check("admin verifies artisan", verify.status === 200 && verify.data.verified === true);

  const publicList = await api("/artisans", {}, {});
  check("verified artisan appears publicly with craft tag",
    publicList.data.some((a) => a.slug.startsWith("sita-devi") && a.crafts.includes("Madhubani painting")));

  console.log(failures === 0 ? "\nPORTALS SMOKE: ALL PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("SMOKE ERROR:", e.message);
  process.exit(1);
});
