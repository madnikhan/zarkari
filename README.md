# ZARKARI Platform

Custom e-commerce shop + Bridal Order Management System (BOMS) for [zarkari.co.uk](https://zarkari.co.uk).

## Monorepo

```
apps/web/          Next.js 16 — shop, admin, supplier portal, customer tracking
packages/db/       Drizzle ORM schema for Neon PostgreSQL
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Shop (collections, products, cart, blog) |
| `/admin` | Owner/staff BOMS dashboard |
| `/supplier` | Supplier accept/reject + production stages |
| `/my-order` | Customer bridal order tracking (OTP) |
| `/login` | Staff & supplier login |

## Quick Start

```bash
unset NPM_CONFIG_PREFIX
npm install
npm run dev
```

Open http://localhost:3000

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@zarkari.co.uk | demo123 |
| Staff | staff@zarkari.co.uk | demo123 |
| Supplier | supplier@zarkari.co.uk | demo123 |

Customer portal: order `BR-2026-0152`, phone `447700900123`

## Deployment

See [docs/platform-deploy.md](docs/platform-deploy.md).

## External Services

- **Stripe** — retail checkout (`/api/checkout`)
- **Soro** — blog webhook (`POST /api/soro/publish`)
- **Meta** — product catalog (`/api/meta/catalog.xml`)
- **Neon** — PostgreSQL (optional; demo mode without `DATABASE_URL`)
- **Cloudflare R2** — file storage (production)
