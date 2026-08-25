const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:4000/api/v1";

let failures = 0;
function check(name, condition, detail = "") {
  if (!condition) failures += 1;
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  const colRes = await fetch(`${BASE}/collections`);
  const collections = await colRes.json().catch(() => []);
  check("GET /collections 200", colRes.status === 200);
  check("4 collections seeded", Array.isArray(collections) && collections.length === 4, `got ${collections.length}`);

  const listRes = await fetch(`${BASE}/products?limit=24`);
  const list = await listRes.json().catch(() => ({ items: [], total: 0 }));
  check("GET /products 200", listRes.status === 200);
  check("8 products seeded", list.total === 8, `total=${list.total}`);

  const sarees = await fetch(`${BASE}/products?collection=sarees`).then((r) => r.json());
  check("sarees collection filter", sarees.items?.length === 3, `got ${sarees.items?.length}`);

  const antiques = await fetch(`${BASE}/products?collection=antiques`).then((r) => r.json());
  check("antiques filter returns 2", antiques.items?.length === 2);

  const pdp = await fetch(`${BASE}/products/kanjivaram-silk-saree-ruby`);
  const product = await pdp.json().catch(() => ({}));
  check("PDP by slug 200", pdp.status === 200);
  check("artisan attached to Kanjivaram", product.artisanProfile?.displayName === "Lakshmi Naidu");
  check("attributes present", typeof product.attributes === "object" && product.attributes !== null);
  check("variant + sku seeded", Boolean(product.variants?.[0]?.sku?.startsWith("KLK-")));

  const missing = await fetch(`${BASE}/products/nope-does-not-exist`);
  check("missing product 404", missing.status === 404);

  const adminOnly = await fetch(`${BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Hack", type: "CRAFT", basePriceMinor: 1 }),
  });
  check("anonymous product create rejected", adminOnly.status === 401 || adminOnly.status === 403, `got ${adminOnly.status}`);

  console.log(failures === 0 ? "\nCATALOG SMOKE: ALL PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("SMOKE ERROR:", e.message);
  process.exit(1);
});
