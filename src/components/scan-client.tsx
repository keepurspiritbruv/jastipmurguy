"use client";

import { useState } from "react";
import { createOrdersFromScanAction, getRateAction, scanReceiptAction } from "@/lib/actions";
import { CATEGORIES, CURRENCIES } from "@/lib/categories";
import { formatForeign, formatIdr } from "@/lib/format";

type Item = { name: string; qty: number; unitPrice: number; category?: string | null };

async function downscale(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Gagal membaca gambar"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Format gambar tidak didukung"));
    image.src = dataUrl;
  });

  const max = 1280;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.6);
}

export default function ScanClient({
  trip,
  error,
}: {
  trip: { id: number; baseCurrency: string; rateUsed: string };
  error?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [merchant, setMerchant] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [currency, setCurrency] = useState(trip.baseCurrency);
  const [rate, setRate] = useState(trip.rateUsed);
  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [fail, setFail] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setFail(null);
    setStatus("Memproses struk...");
    setBusy(true);
    setItems([]);
    try {
      const small = await downscale(file);
      setPreview(small);
      const res = await scanReceiptAction(small, currency);
      if (!res.ok) {
        setFail(res.error);
        setStatus(null);
      } else {
        setMerchant(res.draft.merchant ?? null);
        if (res.draft.currency) setCurrency(res.draft.currency.toUpperCase());
        setItems(res.draft.items);
        setStatus(`${res.draft.items.length} barang terbaca. Periksa dulu sebelum simpan.`);
      }
    } catch (e) {
      setFail((e as Error).message);
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function fetchRate() {
    setFail(null);
    const res = await getRateAction(currency);
    if (res.ok) setRate(String(res.rate));
    else setFail(res.error);
  }

  function patch(index: number, next: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...next } : it)));
  }

  const totalForeign = items.reduce((t, it) => t + it.unitPrice * (it.qty || 1), 0);

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Gagal menyimpan. Pastikan ada barang dan kurs terisi.
        </p>
      ) : null}

      <div className="card space-y-3">
        <p className="text-sm text-stone-600">
          Foto struk dari toko. AI membaca barang & harga, lalu kamu periksa sebelum disimpan.
        </p>
        <label className="btn btn-primary w-full cursor-pointer">
          {busy ? "Memproses..." : "Ambil / pilih foto struk"}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={busy}
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </label>
        {preview ? (
          <img
            src={preview}
            alt="Pratinjau struk"
            className="max-h-52 w-full rounded-xl object-cover"
          />
        ) : null}
        {status ? <p className="text-xs text-emerald-700">{status}</p> : null}
        {fail ? <p className="text-xs text-red-600">{fail}</p> : null}
      </div>

      {items.length > 0 ? (
        <form action={createOrdersFromScanAction} className="space-y-4">
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <input type="hidden" name="foreignCurrency" value={currency} />
          <input type="hidden" name="rateUsed" value={rate} />

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{merchant ?? "Struk"}</p>
              <span className="text-xs text-stone-500">
                {formatForeign(totalForeign, currency)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Mata uang struk</label>
                <select
                  className="input"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.filter((c) => c.code !== "IDR").map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Kurs ke IDR</label>
                <div className="flex gap-2">
                  <input
                    className="input"
                    inputMode="decimal"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                  <button type="button" className="btn btn-ghost shrink-0" onClick={fetchRate}>
                    Kurs
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Modal perkiraan: {formatIdr(totalForeign * (Number(rate) || 0))}
            </p>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="card space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    className="input"
                    value={item.name}
                    onChange={(e) => patch(index, { name: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-danger shrink-0 px-3"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Hapus"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="label">Qty</label>
                    <input
                      className="input"
                      inputMode="numeric"
                      value={item.qty}
                      onChange={(e) => patch(index, { qty: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">Harga ({currency})</label>
                    <input
                      className="input"
                      inputMode="decimal"
                      value={item.unitPrice}
                      onChange={(e) => patch(index, { unitPrice: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="label">Kategori</label>
                    <select
                      className="input"
                      value={item.category ?? "Lainnya"}
                      onChange={(e) => patch(index, { category: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card space-y-3">
            <div>
              <label className="label">Buat atas nama pelanggan</label>
              <input
                name="customerName"
                className="input"
                placeholder="Bu Sri"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <p className="text-xs text-stone-500">
              Semua barang akan masuk sebagai pesanan. Harga jual diisi nanti di daftar pesanan.
            </p>
          </div>

          <button className="btn btn-primary w-full" disabled={busy}>
            Simpan {items.length} barang
          </button>
        </form>
      ) : null}
    </div>
  );
}
