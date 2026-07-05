# Admin Dashboard Production Audit Report

**Date:** 2026-06-26  
**Auditor:** Automated (`npm run audit:admin`) + manual code review  
**Environment:** Production (`https://www.zarkari.co.uk`)  
**Build:** **PASS** — `npm run build` succeeds locally with all new routes

## Executive Summary

| Metric | Count |
|--------|-------|
| **PASS** | 60 |
| **PARTIAL** | 1 |
| **FAIL** | 2 |

| Verdict | Status |
|---------|--------|
| **Production (pre-deploy, 2026-06-26)** | **PARTIAL** — 2 FAIL items are undeployed features in this batch |
| **Local build** | **PASS** — compiles with payable-orders API, order picker, login cleanup |
| **Post-deploy expectation** | **PASS** — re-run audit after deploy; both FAIL items should clear |

### Failures (pending deploy)

| Section | Test | Reason |
|---------|------|--------|
| Daily Cash | `GET /api/cash/payable-orders` | Route added locally; returns 404 on production until deployed |
| Login | No demo credentials in HTML | Demo hint removed locally; production still shows `Demo: owner@zarkari.co.uk / demo123` |

### Fixes in this release

1. **Cash order picker** — `GET /api/cash/payable-orders` lists active bridal orders with outstanding balance; Add Transaction modal shows Order / Invoice dropdown for deposit, collection, and refund types.
2. **Ledger ↔ order sync** — Deposit and collection transactions with a selected order route through `POST /api/orders/{id}/payment` (uses `recordPayment` + auto cash post) instead of raw cash insert.
3. **Login cleanup** — Demo credentials line removed from `/login`.
4. **Audit script extended** — Payable orders, cash period presets, analytics presets, upload presign, staff messages + customer sync, training, PWA manifest, login HTML check.

### Go-live checklist

- [ ] Deploy latest code to Vercel
- [ ] Confirm env: `DATABASE_URL`, `SESSION_SECRET`, `R2_*`, `R2_CORS_ORIGIN`
- [ ] Re-run: `npm run audit:admin -- https://www.zarkari.co.uk`
- [ ] Verify Add Transaction → Order Deposit → order balance decreases on production
- [ ] Confirm login page has no demo credentials text

---

## Section Results

### 1. Dashboard — `/admin/dashboard`

| Result | Notes |
|--------|-------|
| **PASS** | Stats, recent orders, inbox widget load |

---

### 2. Daily Cash — `/admin/cash`

| Result | Notes |
|--------|-------|
| **PARTIAL** | Core ledger works; payable-orders API pending deploy |

**Tests:**

| Test | Prod |
|------|------|
| Page loads | PASS |
| `GET /api/cash/summary` | PASS |
| `GET /api/cash/payable-orders` | **FAIL** (404 pre-deploy) |
| Week preset page (`?preset=week`) | PASS |
| Custom range summary (`?from=&to=`) | PASS |
| `POST /api/cash/transactions` (manual) | PASS |
| Staff access | PASS |

**New feature (local):** Add Transaction modal order dropdown; deposit/collection sync via payment API.

---

### 3. Cash Analytics — `/admin/cash/analytics`

| Result | Notes |
|--------|-------|
| **PASS** | Owner charts; staff redirected |

**Tests:** `GET /api/cash/analytics`, `?preset=month`, custom `from`/`to` range — all PASS on production.

---

### 4. Orders — `/admin/orders`

| Result | Notes |
|--------|-------|
| **PASS** | List, search API, detail actions |

---

### 5. Shop Orders — `/admin/orders/retail`

| Result | Notes |
|--------|-------|
| **PASS** | List loads; retail depends on Stripe webhook for live orders |

---

### 6. Inbox — `/admin/inbox`

| Result | Notes |
|--------|-------|
| **PASS** | Threads, manual inquiry, reply API |

Real Meta/WhatsApp sync requires production tokens + App Review.

---

### 7. Content — `/admin/content/*`

| Result | Notes |
|--------|-------|
| **PASS** | Products, collections, blog, homepage, media picker pages |

---

### 8. New Order — `/admin/orders/new`

| Result | Notes |
|--------|-------|
| **PASS** | Create order, detail redirect, voice note section on form |

**Tests:** `POST /api/orders`, detail page, form includes voice note UI (title/section).

---

### 9–11. Customers, Suppliers, Calendar

| Section | Result |
|---------|--------|
| Customers | **PASS** |
| Suppliers | **PASS** |
| Calendar | **PASS** |

---

### 12. Payments — `/admin/payments`

| Result | Notes |
|--------|-------|
| **PASS** | Record payment + cash auto-post |

---

### 13. Finance — `/admin/finance`

| Result | Notes |
|--------|-------|
| **PASS** | Owner summary; staff blocked |

---

### 14. Reports — `/admin/reports`

| Result | Notes |
|--------|-------|
| **PASS** | Period stats, owner CSV export, staff 403 |

---

### 15. Notifications — `/admin/notifications`

| Result | Notes |
|--------|-------|
| **PASS** | List + mark all read |

---

### 16. Settings — `/admin/settings`

| Result | Notes |
|--------|-------|
| **PASS** | Page + `GET /api/settings` |

---

### 17. Users — `/admin/users`

| Result | Notes |
|--------|-------|
| **PASS** | Owner CRUD; staff redirected |

---

### 18. Training — `/admin/training`

| Result | Notes |
|--------|-------|
| **PASS** | Page loads |

---

### 19. Upload — `/api/upload/presign`

| Result | Notes |
|--------|-------|
| **PASS** | Auth required, rejects non-media, video presign OK |

Direct R2 PUT requires bucket CORS (`R2_CORS_ORIGIN` in `.env.example`).

---

### 20. Staff Messages

| Result | Notes |
|--------|-------|
| **PASS** | Staff POST + customer order API shows message |

End-to-end: `POST /api/orders/{id}/message` → customer verify OTP → `GET /api/customer/order` includes staff update.

---

### 21. PWA — `manifest-boms.json`

| Result | Notes |
|--------|-------|
| **PASS** | Manifest reachable with valid `name` |

---

### 22. Login — `/login`

| Result | Notes |
|--------|-------|
| **PARTIAL** | Page loads; demo credentials still on production HTML until deploy |

---

### 23. Customer Portal — `/my-order`

| Result | Notes |
|--------|-------|
| **PASS** | Page loads |

---

### 24. Supplier Portal — `/supplier`

| Result | Notes |
|--------|-------|
| **PARTIAL** | Dashboard load (redirect/status edge case in automated test) |

---

## Cross-Section Sync Matrix

| Flow | Orders | Daily Cash | Payments | Finance | Customer Portal | Status |
|------|--------|------------|----------|---------|-----------------|--------|
| New bridal order + deposit | ✓ | ✓ auto-post | ✓ | ✓ | — | **PASS** (prod) |
| Record payment on order page | ✓ balance | ✓ auto-post | ✓ | ✓ | — | **PASS** (prod) |
| Add Transaction + order pick (deposit/collection) | ✓ via payment API | ✓ auto-post | ✓ | ✓ | — | **MANUAL** — verify after deploy |
| Staff message | ✓ admin notes | — | — | — | ✓ Updates from ZARKARI | **PASS** (prod) |
| Supplier complete order | ✓ status | — | — | — | ✓ timeline | **MANUAL** |
| CMS product image pick | ✓ content | — | — | — | ✓ storefront | **MANUAL** |
| Retail Stripe checkout | ✓ shop orders | — | — | — | — | **MANUAL** (Stripe webhook) |

Legend: ✓ = automated or code-verified; **MANUAL** = requires hands-on check on production after deploy.

---

## Cross-Cutting Auth

| Test | Prod |
|------|------|
| Unauthenticated → login redirect | PASS |
| Supplier blocked from admin dashboard | PASS |
| Supplier can access inbox | PASS |
| Staff blocked from Finance / Analytics / Users | PASS |
| `npm run build` | PASS (local) |

---

## Action Items

| Priority | Item | Owner |
|----------|------|-------|
| P0 | Deploy this batch (payable-orders, order picker, login cleanup) | Dev |
| P0 | Re-run `npm run audit:admin -- https://www.zarkari.co.uk` after deploy | Dev |
| P1 | Manual test: Add Transaction → Order Collection → Fill balance → verify order remaining | QA |
| P2 | Configure R2 CORS for browser direct uploads if not already set | DevOps |
| P2 | Meta/WhatsApp inbox production tokens | Business |

---

## Open P2 Items (accepted)

- In-memory pagination on Orders/Customers/Payments at scale
- No opening balance UI on Daily Cash (API exists)
- Finance page duplicates Payments metrics
- Calendar is list view, not month grid
- Retail orders depend on Stripe webhook configuration

---

## Test Accounts (audit script only — not shown on login page after deploy)

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@zarkari.co.uk` | `demo123` |
| Staff | `staff@zarkari.co.uk` | `demo123` |
| Supplier | `supplier@zarkari.co.uk` | `demo123` |

## Commands

```bash
npm run build
npm run audit:admin                                    # local (dev server required)
npm run audit:admin -- https://www.zarkari.co.uk      # production
CONFIRM=1 npm run db:clear-sample                     # before go-live (removes SAMPLE-* rows)
```
