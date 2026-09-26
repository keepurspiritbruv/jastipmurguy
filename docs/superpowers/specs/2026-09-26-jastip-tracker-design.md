# Jastip Tracker — Design Spec

Date: 2026-09-26
Status: Approved (approach + decisions)

## Problem

A solo jastip (titip-beli) operator travels abroad, buys items in retail stores
on behalf of paying customers in Indonesia, and needs to track orders, cost,
revenue, and profit **while walking through stores on a phone**. Trips change
location each time. Inputs happen in foreign currencies; money is reported in
IDR.

This is a real small side-business, not corporate finance. The app must be
fast, forgiving, and trustworthy about the numbers that decide profit.

## Goals

- Log an order in seconds, mid-store, on a phone.
- Convert any foreign currency to IDR automatically, using a rate the operator
  can trust and correct.
- Know, per trip: total orders, revenue, total cost, net margin, per-customer
  breakdown.
- Track who has paid; show outstanding balance per customer; generate a
  WhatsApp invoice.
- Optionally scan a foreign receipt and auto-fill the order log.
- Produce an end-of-trip summary shareable to WhatsApp.

## Non-goals (YAGNI)

- Customer-facing portal/accounts.
- Inventory/stock tracking, shipping logistics.
- Accounting-grade ledgers, tax reports, multi-currency wallets.
- Native app-store builds.
- Full offline sync engine (see Connectivity).

## Decisions (locked)

| Area | Decision |
|---|---|
| Connectivity | Online-only, graceful failure. Cache last-known rate + trip data client-side; disable new saves offline with a clear banner. No IndexedDB sync engine. |
| Hosting | Vercel (Next.js App Router) + managed Postgres (Supabase). |
| Local/dev DB | PGlite (embedded Postgres) so `bun run dev` works with zero setup. Prod uses `postgres.js` when `DATABASE_URL` is set. |
| OCR | Z.AI GLM vision `glm-4.5v`, OpenAI-compatible `POST https://api.z.ai/api/paas/v4/chat/completions`, image as base64 data URL. DeepSeek API is text-only and cannot be used. |
| FX | Live rates from `https://open.er-api.com/v6/latest/{CUR}` (no key). Persisted per order + per trip. Operator-editable. |
| Selling price | Manually entered IDR per order. Margin = sell − cost. |
| Secrets | GLM key is server-only; never shipped to the client. |
| Auth | Single operator passcode → HMAC-signed httpOnly cookie. No user table. |
| Money | IDR stored as integer rupiah. Foreign amounts as numeric(14,2). Never float math on money. |

## Why the rate is not trusted blindly

The operator's real cost is the rate they got at the money changer, not the
mid-market rate. So: a live rate is the default, but each trip stores an
editable `rate_used` for its currency, and each order stores the exact rate
applied. Changing a trip rate can recompute affected orders on request.

## Data model

- `trips`: id, name, country, base_currency, rate_used (numeric), rate_source,
  rate_updated_at, start_date, end_date, status ('active'|'closed'), created_at.
- `customers`: id, name, phone, created_at.
- `orders`: id, trip_id, customer_id, item_name, category, qty,
  foreign_currency, unit_cost_foreign (numeric), rate_used (numeric),
  cost_idr (int), sell_price_idr (int), paid (bool), paid_at, receipt_id,
  notes, created_at.
- `receipts`: id, trip_id, image_ref, extracted (jsonb), created_at.

Derived per trip: revenue = Σ sell_price_idr; cost = Σ cost_idr;
margin = revenue − cost; outstanding = Σ sell where not paid.

## Screens (mobile-first, Bahasa Indonesia)

1. **Masuk** — passcode login.
2. **Dasbor** — trip switcher; ringkasan cards (pesanan, omzet, modal, margin,
   margin %); rincian per pelanggan; kategori terlaris.
3. **Trip** — list + create/edit trip (negara, mata uang, kurs, tanggal).
4. **Pesanan** — list filter per trip/pelanggan/belum bayar; add/edit; foreign
   currency secondary label; tandai lunas.
5. **Scan Struk** — camera/upload → GLM → draft lines → review/edit → create.
6. **Pelanggan** — list with outstanding; WhatsApp invoice.
7. **Ringkasan Trip** — akhir trip; top pelanggan, kategori terlaris; share
   WhatsApp.

## Error handling & trust guards

- OCR output is a **draft**; operator confirms each line. Never auto-commit AI
  prices.
- Every save validates with zod at the server boundary.
- Offline/network failure: cached view + disabled write + explicit message.
- All money formatting via `Intl.NumberFormat('id-ID')`.

## Verification

- Unit test on the pure money/currency logic (`bun test`).
- Typecheck (`tsc --noEmit`) + production build.
- Manual smoke against embedded PGlite.

## Stack

Next.js 15 (App Router, TS, Tailwind v4), Drizzle ORM, postgres.js (prod) /
PGlite (dev), zod, node:crypto for auth. No ORM/tooling beyond this.
