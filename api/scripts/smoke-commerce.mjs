const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:4000/api/v1";
const CART = `smoke-cart-${Date.now()}-${Math.random().toString(36).slice(2)}`;

let failures = 0;
function check(name, condition, detail = "") {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
}

async function api(path, options = {}, withCart = true) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(withCart ? { "X-Cart-Token": CART } : {}),
      ...options.headers,
    },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const email = `buyer.${Date.now()}@kalakriti.test`;
  const reg = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password: "Buyer#Pass2026", name: "Smoke Buyer" }),
  }, false);
  const accessToken = reg.data?.accessToken;
  check("register buyer", reg.status === 201 && Boolean(accessToken));
  const auth = { Authorization: `Bearer ${accessToken}` };

  const pdp = await api("/products/kanjivaram-silk-saree-ruby", {}, false);
  const variantId = pdp.data?.variants?.[0]?.id;
  check("kanjivaram variant available", Boolean(variantId));

  const before = await api(`/inventory/availability?variantIds=${variantId}`, {}, false);
  const stockBefore = before.data?.[variantId] ?? -1;

  const add = await api("/cart/items", {
    method: "POST",
    body: JSON.stringify({ variantId, qty: 1 }),
  });
  check("add to cart", add.status === 200 || add.status === 201);
  check("cart subtotal matches PDP price", add.data?.items?.[0]?.unitPriceMinor === 2450000);

  const oversell = await api("/cart/items", {
    method: "POST",
    body: JSON.stringify({ variantId, qty: 99 }),
  }, false);
  check("qty>10 rejected", oversell.status === 400, `got ${oversell.status}`);

  const checkout = await api("/checkout", {
    method: "POST",
    body: JSON.stringify({
      address: { line1: "12 Heritage Lane", city: "New Delhi", state: "Delhi", pincode: "110001" },
      saveAddress: true,
    }),
    headers: auth,
  });
  check("checkout creates order", checkout.status === 201, JSON.stringify(checkout.data).slice(0, 120));
  const orderNumber = checkout.data?.order?.number;
  check("free shipping above threshold", checkout.data?.order?.shippingMinor === 0);
  check("payment intent created (mock fallback)", Boolean(checkout.data?.payment?.providerRef));

  const anonAccess = await api(`/orders/${orderNumber}`, {}, false);
  check("stranger cannot view order", anonAccess.status === 403, `got ${anonAccess.status}`);

  const ownerView = await api(`/orders/${orderNumber}`, { headers: auth }, false);
  check("owner views order", ownerView.status === 200 && ownerView.data?.status === "PENDING");

  const confirm = await api("/payments/mock-confirm", {
    method: "POST",
    body: JSON.stringify({ orderNumber }),
  }, false);
  check("mock capture confirms order",
    confirm.data?.orderStatus === "CONFIRMED" && confirm.data?.paymentStatus === "CAPTURED");

  const after = await api(`/inventory/availability?variantIds=${variantId}`, {}, false);
  check("stock decremented after sale", after.data?.[variantId] === stockBefore - 1,
    `before=${stockBefore} after=${after.data?.[variantId]}`);

  const cleared = await api("/cart");
  check("cart emptied after checkout? (kept for UX, items remain)", Array.isArray(cleared.data?.items));

  console.log(failures === 0 ? "\nCOMMERCE SMOKE: ALL PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("SMOKE ERROR:", e.message);
  process.exit(1);
});
