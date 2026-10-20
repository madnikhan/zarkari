# ZARKARI — Full System Test Workflow (Client UAT)

**Purpose:** Walk through every major path — **customer**, **staff/owner**, and **supplier** — so everyone agrees the live system works.

**Live site:** [https://www.zarkari.co.uk](https://www.zarkari.co.uk)

**How to use this doc**

1. Open the site on **laptop** and **phone** (Safari / Chrome).
2. Work through sections in order (Part 1 → Part 5).
3. Tick each checkbox only when it **passes**.
4. If something fails: write the **step number**, **device**, **exact error text**, and a screenshot.

---

## 0. Logins & roles

| Role | Who | Login URL | Test account |
|------|-----|-----------|--------------|
| **Owner / Staff** | Shop | [/login](https://www.zarkari.co.uk/login) | `owner@zarkari.co.uk` / `demo123` |
| **Staff** (optional) | Shop | same | `staff@zarkari.co.uk` / `demo123` |
| **Supplier** | Atelier | same | `supplier@zarkari.co.uk` / `demo123` |
| **Customer (bridal)** | Buyer | **No password** — use [/my-order](https://www.zarkari.co.uk/my-order) with order # + WhatsApp phone | Created during the test |
| **Customer (shop)** | Buyer | Public homepage | Guest checkout |

> After login, **Owner/Staff** land in `/admin`. **Supplier** lands in `/supplier`. Customers never use staff login.

**Important:** Bridal **invoice number = order number** (e.g. `BR-2026-0042`). Search Payments / Cash with that code.

---

## Overview — how the business flows

```text
CUSTOMER books dress in shop / WhatsApp
        ↓
STAFF creates New Order (deposit, photos, measurements)
        ↓
STAFF sends order to SUPPLIER
        ↓
SUPPLIER accepts → updates production stages → ships
        ↓
STAFF marks ready for collection
        ↓
CUSTOMER tracks progress on /my-order
        ↓
STAFF records balance payment + marks Collected
        ↓
Done (Order Completed)
```

**Separate path:** Customer buys ready-made on the **website shop** → Stripe → staff see shop order under Orders.

---

## Part 1 — Staff: create a bridal order

**Login as:** Owner (`owner@zarkari.co.uk`)

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 1.1 | Open [/admin](https://www.zarkari.co.uk/admin) → **New Order** | Form loads | ☐ |
| 1.2 | Enter customer **name** + **WhatsApp phone** (use a real test number you control) | Fields accept input | ☐ |
| 1.3 | Choose **supplier** (`Karachi Atelier` / supplier account), dress type, total price, deposit, delivery date | Remaining balance calculates automatically | ☐ |
| 1.4 | Choose **deposit method** (Cash / Card / Bank) | Saves with order | ☐ |
| 1.5 | Open measurements (optional) → enter a few values → save | Measurements saved | ☐ |
| 1.6 | Upload a **photo** from phone or laptop | Upload completes; file listed | ☐ |
| 1.7 | Upload / record a short **video** | Upload completes (progress bar; may take time on mobile data) | ☐ |
| 1.8 | Record a **voice memo** | Upload completes; audio playable | ☐ |
| 1.9 | Submit **Create order** | Redirect to order page; order # like `BR-2026-….` | ☐ |
| 1.10 | On order page: check status **Order Created** | Badge shows Order Created | ☐ |
| 1.11 | Invoice card: Total / Paid / Remaining match the form | Numbers correct | ☐ |
| 1.12 | **Download / Print** invoice | PDF/HTML opens with **Invoice / Order No** = that BR number | ☐ |
| 1.13 | Files / Payments tabs | Media + deposit payment visible | ☐ |

**Write down for later:**

- Order number: `________________`
- Customer phone used: `________________`

---

## Part 2 — Staff → Supplier → Staff (production)

### 2A — Staff sends to supplier

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 2.1 | On the order → **Send to supplier** (or equivalent action) | Status → **Sent to Supplier** | ☐ |
| 2.2 | Logout (or open private window) | Clean session | ☐ |

### 2B — Supplier portal

**Login as:** `supplier@zarkari.co.uk` / `demo123` → should open `/supplier`

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 2.3 | See the new order in the supplier list | Order appears | ☐ |
| 2.4 | Open order → **Accept** | Status → **Order Received** (accepted) | ☐ |
| 2.5 | Move through production stages in order: Fabric → Embroidery → Stitching → Finishing → Packing → Shipping | Each stage updates; staff/customer can see progress | ☐ |
| 2.6 | (Optional) Upload a completion photo if prompted | File attaches | ☐ |
| 2.7 | Logout supplier | | ☐ |

### 2C — Staff receives dress

**Login as:** Owner again

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 2.8 | Open the same order | Status reflects supplier progress (e.g. Shipping / Delivered) | ☐ |
| 2.9 | Mark **Delivered to Shop** / **Ready for Collection** as shown on Actions | Status → **Ready for Collection** | ☐ |
| 2.10 | Green **WhatsApp** button opens chat with customer | Prefilled message OK | ☐ |

---

## Part 3 — Customer: track bridal order

**No staff login.** Use phone/laptop as the customer.

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 3.1 | Open [www.zarkari.co.uk/my-order](https://www.zarkari.co.uk/my-order) | Tracking page loads | ☐ |
| 3.2 | Enter **exact order number** + **same WhatsApp phone** from Part 1 | Order opens | ☐ |
| 3.3 | Wrong phone or order # | Access denied / not found (security OK) | ☐ |
| 3.4 | Correct details: see progress steps | Current stage matches staff status (e.g. Ready for Collection) | ☐ |
| 3.5 | Customer can see order info / messaging if enabled | Usable on mobile | ☐ |

---

## Part 4 — Payments, collect, cash, payments search

**Login as:** Owner. Use the same bridal order (Remaining > 0).

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 4.1 | Order page → **Invoice** card shows Remaining | Remaining > £0 | ☐ |
| 4.2 | Tap **Record payment** → enter balance (or part) → Card/Cash → Save | Remaining decreases; Payments tab shows new row | ☐ |
| 4.3 | Go to **Payments** → search `BR-…` (order / invoice #) | Order row appears; Order / Invoice # column shows BR number | ☐ |
| 4.4 | Go to **Daily Cash** → Add transaction → order deposit/collection with that BR # | Saves and links to order (not “orphan” cash) | ☐ |
| 4.5 | When Remaining is ready to finish: **Collect** / Order Completed with amount paid | Status → **Order Completed (Collected)**; Remaining → £0 | ☐ |
| 4.6 | Re-open invoice Download/Print | Paid / Balance match the order | ☐ |

**If order was already “Completed” but still owed money:** open that order → Invoice → **Record payment** (this is supported).

---

## Part 5 — Customer: online shop (retail)

| # | Step | Expected result | Pass |
|---|------|-----------------|------|
| 5.1 | Open [www.zarkari.co.uk](https://www.zarkari.co.uk) (logged out) | Homepage / collections load | ☐ |
| 5.2 | Open a product → Add to cart | Cart updates | ☐ |
| 5.3 | Checkout with Stripe **test** card (if live keys: use a small real card carefully) | Payment succeeds or clear test success page | ☐ |
| 5.4 | Staff: **Orders** → shop / online orders | New retail order listed | ☐ |

*(If Stripe is not configured in this environment, mark 5.3 as N/A and note it.)*

---

## Part 6 — Optional extras (if time)

| # | Area | Quick check | Pass |
|---|------|-------------|------|
| 6.1 | **Stock** | View internal / storefront stock | ☐ |
| 6.2 | **Suppliers** list | Supplier appears; khata page opens | ☐ |
| 6.3 | **Cargo & Boxes** | Add a test box (can delete later) | ☐ |
| 6.4 | **Settings → Storage** | Shows R2 / browser upload OK (green) | ☐ |
| 6.5 | **Training** | Open `/admin/training` guided tour | ☐ |
| 6.6 | Staff vs Owner | Staff cannot access Users / refunds (if testing staff login) | ☐ |

---

## Status cheat sheet (bridal)

| What you see | Meaning |
|--------------|---------|
| Order Created | Booked in system |
| Sent to Supplier | Waiting for atelier |
| Order Received | Supplier accepted |
| Fabric / Embroidery / Stitching / Finishing / Packing | In production |
| Shipping | On the way |
| Delivered to Shop | In store |
| Ready for Collection | Customer can collect |
| Order Completed | Collected — finished |
| Cancelled / Refunded | Stopped (refunds: owner) |

---

## Pass / fail summary (sign-off)

| Area | Pass? | Notes |
|------|-------|-------|
| Staff new order + media upload | ☐ | |
| Supplier accept + stages | ☐ | |
| Customer My Order tracking | ☐ | |
| Payments + Collect + Cash | ☐ | |
| Online shop checkout | ☐ / N/A | |
| Phone tested | ☐ | |
| Laptop tested | ☐ | |

**Test date:** _______________  
**Participants:** _______________  
**Overall result:** Pass / Fail / Pass with notes  

---

## If something fails — capture this

1. **Step number** (e.g. 1.7, 4.3)  
2. **Role** (staff / supplier / customer)  
3. **Device + browser** (iPhone Safari, Android Chrome, laptop…)  
4. **Exact error message** or blank screen  
5. **Screenshot**  
6. For uploads: file type (photo / video / voice) and approximate size  

Send that back — vague “system not working” is not enough to fix; one failed step is.

---

## Quick links

| Link | Use |
|------|-----|
| [www.zarkari.co.uk](https://www.zarkari.co.uk) | Shop |
| [Login](https://www.zarkari.co.uk/login) | Staff & supplier |
| [Admin](https://www.zarkari.co.uk/admin) | BOMS |
| [Supplier](https://www.zarkari.co.uk/supplier) | Atelier |
| [My Order](https://www.zarkari.co.uk/my-order) | Bridal customer tracking |
| [Training](https://www.zarkari.co.uk/admin/training) | In-app tours |
| Staff handbook | `docs/employee-handbook.md` (internal) |

---

*Document version for live UAT on www.zarkari.co.uk — share this file or export to PDF/Google Doc for the client session.*
