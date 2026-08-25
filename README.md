# KALAKRITI

> **Handcrafted heritage, delivered home.**
> A premium marketplace for antiques, handmade crafts, traditional looms & exclusive heritage sarees — sourced directly from master artisans across India.

**Status: v1 feature-complete** (Phases 1–7 shipped). Storefront, admin console, artisan onboarding, commerce with stock-integrity ledger, payments (mock/Razorpay), search sync, and hardened API.

## Stack

| Layer | Tech |
|---|---|
| Storefront | Next.js 15 · React 19 · Tailwind CSS v4 · Framer Motion |
| Admin console | Next.js 15 · JWT-gated live dashboard |
| API | NestJS 10 · TypeScript strict · Prisma · class-validator |
| Database | PostgreSQL 16 (ledger-style inventory) |
| Cache / Search | Redis 7 · Meilisearch (graceful no-op when unset) |
| Payments | Strategy pattern: MockGateway ⇄ RazorpayGateway (HMAC-verified webhooks) |
| Security | JWT + refresh rotation · RBAC guards · helmet · global rate limiting |
| Tooling | pnpm workspaces · Turborepo · ESLint 9 flat · Jest · Husky · GitHub Actions |

## Monorepo map

```
kalakriti/
├── apps/
│   ├── web/        # Customer storefront      → http://localhost:3000
│   └── admin/      # Ops dashboard            → http://localhost:3001
├── api/            # NestJS API               → http://localhost:4000/api/v1
│   ├── prisma/     # schema, migrations, seed
│   └── scripts/    # live E2E smoke suites
└── packages/
    ├── ui/         # Design system (tokens, Button)
    ├── types/      # Shared zod DTO contracts
    └── config/     # tsconfig presets (react/nextjs/nestjs)
```

## Getting started

```bash
corepack enable && corepack prepare pnpm@9.15.4 --activate
pnpm install                      # postinstall auto-generates Prisma client

cp .env.example .env              # defaults work locally; add real keys later
docker compose up -d              # postgres + redis + meilisearch

pnpm --filter @kalakriti/api prisma:migrate   # apply migrations
pnpm --filter @kalakriti/api db:seed          # admin/artisans/collections/products

pnpm dev                          # web :3000 · admin :3001 · api :4000
```

### Seeded credentials (development only)

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@kalakriti.in` | `Admin@Kalakriti1` |
| ARTISAN | `lakshmi@kalakriti.in` | same |
| ARTISAN | `ramesh@kalakriti.in` / `meera@kalakriti.in` | same |

## API surface (`/api/v1`)

Public unless marked 🔒 (JWT) or 🛡️ (ADMIN role).

| Area | Endpoint | Notes |
|---|---|---|
| Health | `GET /health` | liveness probe |
| Auth | `POST /auth/register` · `/auth/login` · `/auth/refresh` | refresh rotation, type-claim enforced |
| Users 🔒 | `GET/PATCH /users/me` · CRUD `/users/me/addresses` | tenant-scoped addresses |
| Catalog | `GET /products?q&type&collection&page&limit` · `GET /products/:slug` · `GET /collections[/:slug]` | PDP includes variants, artisan, COA |
| Products 🛡️ | `POST /products` · `PATCH/DELETE /products/:id` | auto kebab-slug; delete = archive + de-index |
| Inventory | `GET /inventory/availability?variantIds=a,b` | sellable = stock − reserved |
| Cart | `GET /cart` · `POST /cart/items` · `PATCH/DELETE /cart/items/:id` | `X-Cart-Token` header; links to user via Bearer |
| Checkout 🔒* | `POST /checkout` | reserves stock → order → payment intent; guest allowed (*guest = cart-token scoped) |
| Payments | `POST /payments/webhook/razorpay` · `POST /payments/mock-confirm` (dev-only) | capture commits stock + confirms order |
| Orders 🔒* | `GET /orders/me` · `GET /orders/:number` | owner / admin / matching guest token |
| Reviews | `GET /reviews?productId=` public · `POST /reviews` 🔒 · moderate 🛡️ | `verifiedPurchase` from confirmed order lines only |
| Wishlist 🔒 | `GET /wishlist/me` · `POST/DELETE /wishlist/me/:productSlug` | |
| Notifications 🔒 | `GET /notifications/me` · `PATCH /notifications/me/:id/read` | ORDER_CONFIRMED queued at capture |
| Artisans | `GET /artisans` public · `POST /artisans/apply` 🔒 · `GET/PATCH /artisans/me` 🔒 · `PATCH /artisans/:id/verify` 🛡️ | verify promotes role → ARTISAN |
| Admin 🛡️ | `GET /admin/stats` · `GET /admin/orders` · `PATCH /admin/orders/:number/status` | state machine enforced |

## Verification matrix

| Suite | Command | Status |
|---|---|---|
| Unit tests | `pnpm test` | 18 passing |
| Lint / Typecheck / Build | `pnpm lint && pnpm typecheck && pnpm build` | green in CI |
| Identity smoke | `node api/scripts/smoke-identity.mjs` | 12 checks |
| Catalog smoke | `node api/scripts/smoke-catalog.mjs` | 12 checks |
| Commerce smoke | `node api/scripts/smoke-commerce.mjs` | 13 checks |
| Engagement smoke | `node api/scripts/smoke-engagement.mjs` | 15 checks |
| Portals smoke | `node api/scripts/smoke-portals.mjs` | 13 checks |

All smokes run against a **live server + real Postgres** and assert business outcomes (stock decrements, RBAC denials, state-machine rejections, revenue aggregation).

## Environment variables

| Key | Purpose | Default (dev) |
|---|---|---|
| `DATABASE_URL` | Postgres connection | docker compose default |
| `MEILI_HOST` / `MEILI_MASTER_KEY` | Search; unset ⇒ sync disabled gracefully | set by compose |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Token signing (separate secrets) | insecure dev fallbacks — **override always** |
| `JWT_ACCESS_TTL` / `JWT_REFRESH_TTL` | 900s / 30d | |
| `RAZORPAY_KEY_ID` / `KEY_SECRET` / `WEBHOOK_SECRET` | Unset keys ⇒ Mock gateway auto-fallback | empty |
| `THROTTLE_TTL_MS` / `THROTTLE_LIMIT` | Global rate limit window | 60000 / 240 |
| `NEXT_PUBLIC_API_URL` | Storefront/admin API base | `http://localhost:4000/api/v1` |

## Security posture

- Refresh tokens signed with a **separate secret** and type-claimed; access tokens short-lived
- Global guard chain: **rate-limit → JWT → RBAC**; routes opt into publicity explicitly via `@Public()`
- Money as integer paise everywhere; inventory mutations only through the guarded ledger service
- Razorpay webhooks verified against raw body HMAC; mock confirm route hard-blocked in production
- helmet security headers; unknown exceptions sanitized to generic 500 (details logged server-side)
- Guest order access requires exact cart-token match — no IDOR path

## Runbook quick reference

```bash
pnpm dev                # everything hot-reloading
pnpm build              # turbo production build
docker compose up -d    # infra
pnpm --filter @kalakriti/api start:dev   # api alone (watch)
```

CI runs install → prisma generate → lint → typecheck → test → build on every push.

## Roadmap — delivered

- [x] Phase 1 — Foundation: monorepo, design tokens, API skeleton, DB schema, CI
- [x] Phase 2 — Identity: JWT auth + rotation, RBAC, profile & addresses
- [x] Phase 3 — Catalog: products/variants/attributes, collections, Meilisearch, PLP/PDP
- [x] Phase 4 — Commerce: cart, checkout saga, reservations, payments, orders
- [x] Phase 5 — Engagement: verified reviews, wishlist, notifications
- [x] Phase 6 — Portals: admin console, artisan onboarding & directory
- [x] Phase 7 — Hardening: rate limiting, helmet, exception sanitization, docs

### Next candidates (post-v1)
Real Razorpay checkout SDK on web · Shiprocket label purchase · image pipeline UI · Redis-backed token revocation · Sentry DSN wiring · k6 load profiles.
