const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:4000/api/v1";

const results = [];
let failures = 0;

function check(name, condition, detail = "") {
  const pass = Boolean(condition);
  if (!pass) failures += 1;
  results.push(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
}

async function main() {
  const email = `smoke.${Date.now()}@kalakriti.test`;

  const regRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "SareeSecret#2026",
      name: "Smoke Tester",
    }),
  });
  const reg = await regRes.json().catch(() => ({}));
  check("register returns 201", regRes.status === 201, `got ${regRes.status}`);
  check("register returns role CUSTOMER", reg.user?.role === "CUSTOMER");
  check("register returns access + refresh", Boolean(reg.accessToken && reg.refreshToken));

  const noAuth = await fetch(`${BASE}/users/me`);
  check("protected route rejects anonymous", noAuth.status === 401, `got ${noAuth.status}`);

  const meRes = await fetch(`${BASE}/users/me`, {
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  });
  const me = await meRes.json();
  check("GET /users/me with token", meRes.status === 200 && me.email === email);

  const addrRes = await fetch(`${BASE}/users/me/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${reg.accessToken}`,
    },
    body: JSON.stringify({
      label: "Home",
      line1: "12 Weaver Lane",
      city: "Kanchipuram",
      state: "Tamil Nadu",
      pincode: "631502",
    }),
  });
  const addr = await addrRes.json().catch(() => ({}));
  check("create address", addrRes.status === 201);
  check("first address auto-default", addr.isDefault === true);

  const updRes = await fetch(`${BASE}/users/me/addresses/${addr.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${reg.accessToken}`,
    },
    body: JSON.stringify({ city: "Varanasi", state: "Uttar Pradesh" }),
  });
  const upd = await updRes.json().catch(() => ({}));
  check("update address", updRes.status === 200 && upd.city === "Varanasi");

  const listRes = await fetch(`${BASE}/users/me/addresses`, {
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  });
  const list = await listRes.json();
  check("list addresses scoped to user", Array.isArray(list) && list.length === 1);

  const delRes = await fetch(`${BASE}/users/me/addresses/${addr.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${reg.accessToken}` },
  });
  check("delete address 204", delRes.status === 204);

  const refRes = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: reg.refreshToken }),
  });
  const refreshed = await refRes.json().catch(() => ({}));
  check("refresh rotation issues new pair", Boolean(refreshed.accessToken && refreshed.refreshToken));

  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "SareeSecret#2026" }),
  });
  check("login with credentials", loginRes.status === 200);

  console.log(results.join("\n"));
  console.log(`\n${failures === 0 ? "ALL SMOKE TESTS PASSED" : `${failures} FAILURE(S)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("SMOKE RUNNER ERROR:", err.message);
  process.exit(1);
});
