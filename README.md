# KALAKRITI

> **Handcrafted heritage, delivered home.**
> A premium marketplace for antiques, handmade crafts, traditional looms & exclusive heritage sarees — sourced directly from master artisans across India.

## Stack

| Layer | Tech |
|---|---|
| Storefront | Next.js 15 · React 19 · Tailwind CSS v4 · Framer Motion |
| Admin | Next.js 15 (separate app) |
| API | NestJS 10 · TypeScript strict |
| Database | PostgreSQL 16 + Prisma |
| Cache / Search | Redis 7 · Meilisearch |
| Tooling | pnpm workspaces · Turborepo · ESLint · Jest · Husky · GitHub Actions |

## Monorepo map

```
kalakriti/
├── apps/
│   ├── web/        # Customer storefront  → http://localhost:3000
│   └── admin/      # Ops dashboard        → http://localhost:3001
├── api/            # NestJS API           → http://localhost:4000/api/v1
│   └── prisma/     # Schema, migrations, seed
└── packages/
    ├── ui/         # Design system (tokens, Button)
    ├── types/      # Shared zod schemas & DTOs
    └── config/     # tsconfig presets
```

## Getting started

```bash
corepack enable && corepack prepare pnpm@9.15.4 --activate
pnpm install

cp .env.example .env          # fill secrets before Phase 4
docker compose up -d          # postgres + redis + meilisearch

pnpm --filter @kalakriti/api prisma:migrate   # first migration
pnpm dev                       # web :3000 · admin :3001 · api :4000
```

## Quality gates

```bash
pnpm lint         # ESLint (typescript-eslint flat config)
pnpm typecheck    # tsc --noEmit per workspace
pnpm test         # Jest (API unit tests)
pnpm build        # Turbo production build
```

Pre-commit runs `lint-staged` (eslint --fix + prettier). CI mirrors all gates on every PR.

## Roadmap

- [x] Phase 1 — Foundation: monorepo, design tokens, API skeleton, DB schema, CI
- [x] Phase 2 — Identity: auth (JWT + refresh rotation), RBAC guards, profile & addresses
- [x] Phase 3 — Catalog: products, variants, attributes, collections, Meilisearch sync, storefront PLP/PDP
- [x] Phase 4 — Commerce: cart (guest token + merge), checkout saga w/ stock reservation, payments (Strategy: Mock/Razorpay), orders
- [ ] Phase 5 — Engagement: reviews, wishlist, notifications
- [ ] Phase 6 — Portals: admin ops + artisan onboarding & certificates
- [ ] Phase 7 — Hardening: caching, rate limits, Sentry, load tests

## Design language

Ivory `#FAF7F2` canvas · ink `#1C1917` · terracotta `#C0562F` · gold `#B08A3E` · emerald `#1F4D3F`
Cormorant Garamond display serif over Inter. Museum-catalog editorial feel, WCAG AA.
