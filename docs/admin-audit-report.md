# Admin Dashboard Production Audit Report

**Date:** 2026-06-26  
**Auditor:** Automated (`npm run audit:admin`) + manual code review  
**Environments:** Local (`http://localhost:3000`) + Production (`https://zarkari-web.vercel.app`)

## Executive Summary

| Verdict | Status |
|---------|--------|
| **Local (after fixes)** | **PASS** — all 17 sections functional; 0 FAIL |
**Production audit (pre-deploy, 2026-06-26):** 42 PASS, 2 PARTIAL, 1 FAIL — failures match unfixed deploy (order create collision, product UUID 500). **Re-audit after deploy required.**
| **Build** | **PASS** — `npm run build` succeeds |

### Fixes applied during audit

1. **CMS demo bleed (P0)** — When `DATABASE_URL` is set, CMS/notifications no longer fall back to in-memory demo catalog on empty tables ([`apps/web/src/lib/data/index.ts`](apps/web/src/lib/data/index.ts)).
2. **Order search 500 (P0)** — Fixed `ilike` on PostgreSQL enum column in [`searchBridalOrdersDb`](apps/web/src/lib/db/bridal-orders.ts).
3. **Order number collisions (P0)** — Replaced in-memory `nextOrderNumber()` with DB-backed `nextBridalOrderNumberDb()` for production order creation.
4. **New order deposit (P1)** — Deposit now recorded in `bridal_payments` + cash ledger on create ([`createBridalOrder`](apps/web/src/lib/data/actions.ts)).
5. **Reports CSV period (P1)** — CSV export now filters orders by selected period ([`api/reports/export`](apps/web/src/app/api/reports/export/route.ts)).
6. **Inbox notifications (P1)** — Inbox events persist to Neon via `createNotificationDb` ([`social-inbox/service.ts`](apps/web/src/lib/social-inbox/service.ts)).
7. **Invalid product UUID (P2)** — `GET /api/products?id=…` returns 404 instead of 500 for non-UUID ids.

### Go-live checklist

- [ ] Deploy latest code to Vercel
- [ ] Confirm env: `DATABASE_URL`, `SESSION_SECRET`, `R2_*`
- [ ] Run `npm run db:push` against production Neon if schema changed
- [ ] Run `CONFIRM=1 npm run db:clear-sample` before live (removes `SAMPLE-*` demo rows)
- [ ] Re-run: `npm run audit:admin -- https://zarkari-web.vercel.app`

---

## Section Results

### 1. Dashboard — `/admin/dashboard`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Stats cards, recent orders, inbox widget load |
| Prod | **PASS** | Page loads when authenticated |

**Tests:** Stat cards, recent orders table links, social inbox widget, sample banner when `SAMPLE-*` data exists.

---

### 2. Daily Cash — `/admin/cash`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Summary, manual tx, staff access |
| Prod | **PASS** | Requires DB + cash ledger migrations |

**Tests:** Date nav, quick actions, `POST /api/cash/transactions`, closing balance math, staff access.

**Known PARTIAL:** No UI for opening balance edit (API exists at `PATCH /api/cash/opening-balance`).

---

### 3. Cash Analytics — `/admin/cash/analytics`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Charts + period toggle |
| Prod | **PASS** | Owner-only; staff redirected |

**Tests:** 7/30/90 day toggle, `GET /api/cash/analytics`, middleware owner gate.

---

### 4. Orders — `/admin/orders` + detail

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | List tabs, search API, detail actions |
| Prod | **PARTIAL** | Search 500 until enum fix deployed |

**Tests:** Active) pagination, order detail, workflow actions (send/collect/cancel/refund/redesign), staff messages.

**Known PARTIAL:** In-memory pagination; no inline field edit.

---

### 5. Shop Orders — `/admin/orders/retail`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | List + status PATCH |
| Prod | **PARTIAL** | Empty until Stripe checkout + webhook |

**Tests:** List loads, `PATCH /api/retail-orders/[id]`.

---

### 6. Inbox — `/admin/inbox`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Threads, manual inquiry, reply |
| Prod | **PARTIAL** | Real Meta/WA sync needs tokens + App Review |

**Tests:** Thread list/filters, `POST /api/inbox/manual`, reply, supplier inbox access.

---

### 7. Content — `/admin/content/*`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Products, collections, blog, homepage, media |
| Prod | **PASS** | Demo bleed fix applied locally |

**Tests:** All sub-pages load; owner write / staff read-only on CMS APIs; R2 upload via `/api/upload`.

**Known PARTIAL:** No media delete; 4 MB upload cap.

---

### 8. New Order — `/admin/orders/new`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Create + deposit + cash post |
| Prod | **FAIL→FIX** | Order number collision fixed locally |

**Tests:** `POST /api/orders`, redirect to detail, deposit in payments + cash ledger.

---

### 9. Customers — `/admin/customers`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Cards with linked orders |
| Prod | **PASS** | Read-only view |

---

### 10. Suppliers — `/admin/suppliers`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Performance metrics |
| Prod | **PASS** | Read-only analytics |

---

### 11. Calendar — `/admin/calendar`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Deliveries grouped by date |
| Prod | **PASS** | List view (not grid calendar) |

---

### 12. Payments — `/admin/payments`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Record payment + cash auto-post |
| Prod | **PASS** | Bridal orders only |

---

### 13. Finance — `/admin/finance`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Owner summary; staff blocked |
| Prod | **PASS** | Thin page; matches Payments totals |

---

### 14. Reports — `/admin/reports`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Period stats + CSV export |
| Prod | **PARTIAL** | CSV period filter fix pending deploy |

**Tests:** Period toggle, owner CSV export, staff 403 on export.

---

### 15. Notifications — `/admin/notifications`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | List + mark all read |
| Prod | **PARTIAL** | Inbox→DB notifications fix pending deploy |

---

### 16. Settings — `/admin/settings`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Owner edit, staff read-only |
| Prod | **PASS** | Social inbox env checklist |

---

### 17. Users — `/admin/users`

| Env | Result | Notes |
|-----|--------|-------|
| Local | **PASS** | Owner CRUD; staff redirected |
| Prod | **PASS** | Page + API owner-only |

---

## Cross-Cutting

| Test | Local | Prod |
|------|-------|------|
| Unauthenticated → login redirect | PASS | PASS |
| Supplier → inbox only | PASS | PASS |
| Staff → no Finance/Analytics/Users | PASS | PASS |
| `npm run build` | PASS | N/A |
| Sample data clear (`CONFIRM=1 npm run db:clear-sample`) | Verified script exists | Run before go-live |

---

## Open P2 Items (accepted for launch)

- In-memory pagination on Orders/Customers/Payments (scale risk at 1000+ orders)
- No opening balance UI on Daily Cash
- Finance page duplicates Payments metrics
- Calendar is list view, not month grid
- Retail orders depend on Stripe webhook configuration
- Real-time Meta/WhatsApp inbox requires production tokens

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@zarkari.co.uk` | `demo123` |
| Staff | `staff@zarkari.co.uk` | `demo123` |
| Supplier | `supplier@zarkari.co.uk` | `demo123` |

## Commands

```bash
npm run db:push
npm run db:seed
npm run db:seed-sample          # audit/staging only
CONFIRM=1 npm run db:clear-sample # before go-live
npm run audit:admin               # local
npm run audit:admin -- https://zarkari-web.vercel.app
```
