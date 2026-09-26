# Jastip Tracker

Aplikasi catat pesanan untuk pelaku jastip (titip-beli). Dipakai sambil jalan di
toko di luar negeri, dari HP. Multi-mata uang → otomatis konversi ke Rupiah,
dengan kurs yang bisa kamu koreksi manual.

## Fitur

- **Dasbor per trip** — total pesanan, omzet, modal, margin, rincian per pelanggan.
- **Pesanan** — input cepat: barang, pelanggan, kategori, qty, harga asing, kurs,
  harga jual IDR. Mata uang asing tampil sebagai label sekunder.
- **Multi-mata uang** — JPY, KRW, SGD, THB, HKD, USD, dst. Kurs live dari
  open.er-api.com, disimpan per pesanan, bisa diubah manual.
- **Scan struk** — foto struk → AI (GLM vision) membaca barang & harga → kamu
  periksa dulu sebelum disimpan.
- **Pelanggan & tagihan** — siapa belum lunas, kirim tagihan via WhatsApp, lunasi
  semua sekali klik.
- **Ringkasan akhir trip** — omzet, margin, pelanggan teratas, kategori terlaris,
  langsung share ke WhatsApp.

## Menjalankan lokal

```bash
bun install
bun run db:push   # buat tabel (pakai PGlite tersemat di ./.pglite, tanpa setup)
bun run seed      # (opsional) data contoh
bun run dev       # buka http://localhost:3000
```

Masuk pakai kode akses dari `APP_PASSCODE` di `.env.local` (default: `jastip`).

## Variabel lingkungan

Salin `.env.example` ke `.env.local` lalu isi:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `DATABASE_URL` | prod | Koneksi Postgres (Vercel Postgres / Neon / Supabase). Kosongkan untuk mode lokal (PGlite). |
| `GLM_API_KEY` | untuk scan | API key Z.AI (BigModel). Scan struk tidak jalan tanpa ini. |
| `GLM_BASE_URL` | opsional | Default `https://api.z.ai/api/paas/v4`. |
| `APP_PASSCODE` | ya | Kode akses masuk aplikasi. |
| `AUTH_SECRET` | ya | String acak panjang untuk menandatangani cookie sesi. |

## Deploy ke Vercel

1. Push repo ini ke GitHub, lalu import di Vercel (atau `vercel`).
2. Atur framework preset **Next.js**.
3. Tambahkan environment variables di atas.
4. `DATABASE_URL` wajib diisi (mis. buat database di Vercel Postgres / Neon).
5. Deploy.

> Catatan: mode lokal memakai PGlite tersemat agar bisa langsung jalan tanpa
> database. Di Vercel, selalu isi `DATABASE_URL` — filesystem serverless tidak
> bisa menyimpan data secara permanen.

## Teknologi

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Drizzle ORM ·
postgres.js (prod) / PGlite (dev) · zod · auth cookie dengan HMAC (`node:crypto`).
Tidak ada ORM/alat lain.

## Struktur

- `src/lib/money.ts` — logika uang murni (konversi, margin) + unit test.
- `src/lib/queries.ts` — akses data.
- `src/lib/actions.ts` — server actions (auth, order, scan, kurs).
- `src/lib/ocr.ts` — panggil GLM vision untuk struk.
- `src/lib/fx.ts` — ambil kurs live.
