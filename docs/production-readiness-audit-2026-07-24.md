# Production readiness audit — 2026-07-24

**Target:** Neon-backed stack (local `next start` + live `https://www.zarkari.co.uk`)  
**Tools:** `npm run build`, `npm run lint`, `npm run test:r2`, `npm run audit:admin`, `npm run audit:smoke`

## Verdict: **NO-GO for live** until security deploy; **GO for local/staging** after deploy checklist

| Environment | Verdict | Notes |
|-------------|---------|-------|
| Local (this branch) | **GO** with caveats | Core BOMS flows PASS; lint dirty; optional integrations missing |
| Live (`www.zarkari.co.uk`) | **NO-GO** | Demo auth still accepted; cron open without secret |

---

## Phase 0 — Infra

| Check | Result |
|-------|--------|
| `DATABASE_URL` (pooler) | PASS (local `.env.local`) |
| `SESSION_SECRET` | PASS (not weak) |
| `NEXT_PUBLIC_SITE_URL` | SET (local points to localhost) |
| R2 credentials + `test:r2` | PASS (bucket, presign, PUT, public read) |
| Stripe / Resend / Meta / WhatsApp / `CRON_SECRET` | MISSING in local env — document as optional/blocked |
| Firebase client + admin project | SET locally |
| `npm run build` | PASS |
| `npm run lint` | **FAIL** — 68 errors (mostly `prefer-const` in demo seed stores) |
| Demo users on live | **FAIL (critical)** — see Phase 1 |

**Fixes applied in this audit (not yet on live):**
1. Disable in-memory demo login when `DATABASE_URL` is configured (`session.ts`)
2. Require `CRON_SECRET` when DB/production (`cron/deadlines`)
3. `admin-audit.ts` duplicate symbol + `AUDIT_*` env credentials
4. New `scripts/prod-readiness-smoke.ts` + `npm run audit:smoke`

---

## Phase 1 — Auth matrix

| Test | Local | Live |
|------|-------|------|
| Owner UUID login (`owner1@…`) | PASS | PASS (after audit password set) |
| Staff UUID (`staff-audit@…`) | PASS | (DB user created) |
| Supplier UUID (`asif@…`) | PASS | (password rotated for audit) |
| Demo `owner@…/demo123` | **PASS blocked** (401) | **FAIL — still 200** |
| Staff blocked Users / cash analytics / finance | PASS (307) | (middleware present; re-verify after deploy) |
| Supplier blocked `/admin` | PASS | PASS (unauth redirect works) |
| Unauthenticated `/admin` → login | PASS | PASS |

---

## Phase 2 — Bridal orders

Local smoke + admin audit:

- Create order, measurements PATCH, extra charges, Files media attach — PASS  
- Send → supplier accept → stages → arrived-uk → receive → collect — PASS  
- Bridal invoice — PASS  
- Video/multipart + voice upload (admin-audit) — PASS  
- WhatsApp share — PARTIAL/blocked (no WA token; `whatsApp.sent: false`)

---

## Phase 3 — Cash + cargo

- Cash `other_in` / `business_expense` JSON save — PASS  
- Opening balance PATCH — PASS  
- Cargo create box + item + post khata + print — PASS  
- UUID `createdByUserId` guards present on cash/cargo write paths — PASS (code + smoke)

---

## Phase 4 — Suppliers / stock / retail

- Khata bill + payment (syncs cash) — PASS  
- Stock page — PASS  
- Stock adjust receive — PASS (after smoke SQL fix)  
- Ready-made Sale (`/api/retail-orders/walk-in`) — PASS when stock/variant available  

---

## Phase 5 — CMS / uploads

- Homepage / products CMS pages — PASS  
- Media list API — PASS  
- Storefront home — PASS  
- R2 upload path (presign + multipart video) — PASS (admin-audit)  
- Social auto-posting — out of scope (not built)

---

## Phase 6 — Portals / communications

- Customer verify + order page + message — PASS  
- Supplier portal + print sheet — PASS  
- Inbox list + manual inquiry — PASS  
- Meta/WA two-way inbox — **BLOCKED on env** (tokens missing locally; treat live similarly unless set in Vercel)  
- Notifications API — PASS  
- Firebase push — env present; deep device register not exercised end-to-end

---

## Phase 7 — Reports / cron

- Reports overview / cash / P&L / finance (owner) — PASS  
- Staff CSV export blocked (admin-audit) — PASS  
- Cron unauthenticated: **local PASS (503)**; **live FAIL (200 open)** until deploy + `CRON_SECRET`

---

## Defect log (priority)

### P0 — must fix before calling live production-ready

1. **Demo auth fallback on live** — `owner@` / `staff@` / `supplier@` + `demo123` still authenticate and mint non-UUID session ids. Fixed locally; **deploy required**.  
2. **Open cron endpoint on live** — `GET /api/cron/deadlines` returns 200 without auth when `CRON_SECRET` unset. Fixed locally; **set `CRON_SECRET` in Vercel + deploy**.  
3. **Weak DB owner password** — `test@zarkari.com` accepted `demo123` on live. Rotate all owner/staff/supplier passwords after deploy.

### P1 — should fix soon

4. **Lint fails** — 68 ESLint errors (seed/demo `prefer-const` etc.); CI should not treat lint as green.  
5. **No staff user previously** — only owners + one supplier in DB; staff-audit user was created for this audit.  
6. **Optional integrations missing locally** — Stripe, Resend, Meta, WhatsApp, Cron secret. Confirm Vercel prod env separately.  
7. **`NEXT_PUBLIC_SITE_URL` in local env is localhost** — ensure Vercel has `https://www.zarkari.co.uk`.

### P2 — follow-ups

8. Full Playwright suite (recommended after cutover).  
9. Stale Shopify-era docs.  
10. Facebook/IG/TikTok auto-posting (not built).

---

## Deploy checklist (to flip live to GO)

1. Deploy this branch (auth + cron fixes).  
2. Set Vercel `CRON_SECRET`; configure cron job `Authorization: Bearer …`.  
3. Rotate passwords for `test@zarkari.com`, `owner1@…`, `asif@…`, remove/disable demo accounts.  
4. Confirm Stripe live keys if retail checkout is live.  
5. Re-run:
   ```bash
   npm run audit:admin -- https://www.zarkari.co.uk
   AUDIT_OWNER_EMAIL=… AUDIT_OWNER_PASSWORD=… npm run audit:smoke -- https://www.zarkari.co.uk
   ```
6. Confirm live demo login returns **401**.

---

## Audit account notes

For this pass, DB passwords were set for audit users (`owner1@`, `staff-audit@`, `asif@`) to a temporary shared audit password. **Rotate them immediately after go-live.**
