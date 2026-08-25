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

async function buyProduct(emailBase, slug) {
  const email = `${emailBase}.${Date.now()}@kalakriti.test`;
  const reg = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Buyer#Pass2026", name: "Engagement Tester" }),
  });
  const auth = { Authorization: `Bearer ${reg.data.accessToken}` };
  const cartToken = `eng-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const pdp = await api(`/products/${slug}`, {}, {});
  const variantId = pdp.data.variants[0].id;

  await fetch(`${BASE}/cart/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Cart-Token": cartToken },
    body: JSON.stringify({ variantId, qty: 1 }),
  });
  const co = await fetch(`${BASE}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Cart-Token": cartToken, ...auth },
    body: JSON.stringify({
      address: { line1: "5 Test Lane", city: "Pune", state: "Maharashtra", pincode: "411001" },
    }),
  });
  const coData = await co.json();
  await api("/payments/mock-confirm", {
    method: "POST",
    body: JSON.stringify({ orderNumber: coData.order.number }),
  });
  return { auth, orderNumber: coData.order.number };
}

async function main() {
  const kanjivaram = await api("/products/kanjivaram-silk-saree-ruby", {}, {});
  const productId = kanjivaram.data.id;

  const buyer = await buyProduct("buyerA", "chanderi-cotton-silk-saree");
  check("buyer purchased chanderi (for verified review on other product)", Boolean(buyer.auth.Authorization));

  const revBuyer = await api("/reviews", {
    method: "POST",
    body: JSON.stringify({
      productId,
      rating: 5,
      title: "Worth every rupee",
      body: "The weave is flawless.",
    }),
  }, buyer.auth);
  check("buyer posts review", revBuyer.status === 200 || revBuyer.status === 201);
  check("reviewing unpurchased piece -> unverified", revBuyer.data?.verifiedPurchase === false);

  const revOwn = await api("/reviews", {
    method: "POST",
    body: JSON.stringify({
      productId: "REPLACED_LATER",
      rating: 5,
    }),
  }, buyer.auth);

  const chanderi = await api("/products/chanderi-cotton-silk-saree", {}, {});
  const revVerified = await api("/reviews", {
    method: "POST",
    body: JSON.stringify({ productId: chanderi.data.id, rating: 5, title: "Air-light" }),
  }, buyer.auth);
  check("purchased piece review -> VERIFIED", revVerified.data?.verifiedPurchase === true);

  const regB = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: `window.${Date.now()}@kalakriti.test`,
      password: "Window#Pass1",
      name: "Window Shopper",
    }),
  });
  const revB = await api("/reviews", {
    method: "POST",
    body: JSON.stringify({ productId, rating: 4, title: "Beautiful" }),
  }, { Authorization: `Bearer ${regB.data.accessToken}` });
  check("non-buyer can review (unverified flag)", revB.status === 200 || revB.status === 201);
  check("non-buyer flagged unverified", revB.data?.verifiedPurchase === false);
  void revOwn;

  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@kalakriti.in", password: "Admin@Kalakriti1" }),
  });
  check("seeded admin can login", adminLogin.status === 200);
  const adminAuth = { Authorization: `Bearer ${adminLogin.data.accessToken}` };

  const approve = await api(`/reviews/${revVerified.data.id}/moderate`, { method: "PATCH" }, adminAuth);
  check("admin approves verified review", approve.status === 200 && approve.data.status === "APPROVED");
  check("customer cannot moderate", (await api(`/reviews/${revVerified.data.id}/reject`, { method: "PATCH" }, buyer.auth)).status === 403);

  const list = await api(`/reviews?productId=${chanderi.data.id}`, {}, {});
  check("approved reviews public with summary",
    list.status === 200 &&
    list.data?.summary?.count >= 1 &&
    list.data.items.some((r) => r.title === "Air-light" && r.verifiedPurchase === true),
    `count=${list.data?.summary?.count}`);

  const wl = await api("/wishlist/me/kanjivaram-silk-saree-ruby", { method: "POST" }, buyer.auth);
  check("wishlist add by slug", wl.data?.wishlisted === true);
  const wlList = await api("/wishlist/me", {}, buyer.auth);
  check("wishlist lists item", wlList.data.some((i) => i.product.slug === "kanjivaram-silk-saree-ruby"));
  const wlDel = await api("/wishlist/me/kanjivaram-silk-saree-ruby", { method: "DELETE" }, buyer.auth);
  check("wishlist remove 204", wlDel.status === 204);

  const notifs = await api("/notifications/me", {}, buyer.auth);
  const confirmed = notifs.data.find((n) => n.type === "ORDER_CONFIRMED");
  check("ORDER_CONFIRMED notification queued from Phase 4 capture", Boolean(confirmed));
  if (confirmed) {
    const read = await api(`/notifications/me/${confirmed.id}/read`, { method: "PATCH" }, buyer.auth);
    check("mark notification read -> SENT", read.data?.status === "SENT");
  }

  console.log(failures === 0 ? "\nENGAGEMENT SMOKE: ALL PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("SMOKE ERROR:", e.message);
  process.exit(1);
});
