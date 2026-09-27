"use client";

import { useState, useTransition } from "react";
import { createClientOrderAction, searchPriceAction } from "@/lib/actions";
import { formatForeign, formatIdr } from "@/lib/format";

type Result = {
  product: string;
  currency: string;
  results: { store: string; price: number; url: string | null }[];
  recommended: { store: string; price: number; reason: string | null } | null;
};

type SearchResponse =
  | {
      ok: true;
      result: Result;
      rate: number;
      markup: number;
      modalIdr: number;
      totalIdr: number;
      feeIdr: number;
    }
  | { ok: false; error: string };

export default function SearchClient({ ok, error }: { ok: boolean; error?: string }) {
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");
  const [resp, setResp] = useState<SearchResponse | null>(null);
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function runSearch() {
    const q = `${product} ${location}`.trim();
    if (q.length < 3) return;
    start(async () => {
      setResp(await searchPriceAction(q));
    });
  }

  const rec = resp?.ok ? resp.result.recommended : null;

  return (
    <div className="space-y-4">
      {ok ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Pesanan kamu sudah masuk. Kami akan menghubungi via WhatsApp.
        </p>
      ) : null}
      {error === "1" ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          Data belum lengkap. Isi nama dan barang dulu.
        </p>
      ) : null}
      {error === "2" ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
          Terlalu banyak pesanan. Coba lagi nanti.
        </p>
      ) : null}

      <div className="card space-y-3">
        <h1 className="text-lg font-bold">Cek harga jastip</h1>
        <p className="text-sm text-stone-500">
          Cari harga asli barang di toko Jepang, lihat harganya plus fee jastip.
        </p>
        <div>
          <label className="label">Nama barang + merk</label>
          <input
            className="input"
            placeholder="Asics Gel Kayano 14"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Lokasi (opsional)</label>
          <input
            className="input"
            placeholder="Shibuya / Kichijoji"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button className="btn btn-primary w-full" disabled={pending} onClick={runSearch}>
          {pending ? "Mencari harga..." : "Cari harga"}
        </button>
      </div>

      {resp && !resp.ok ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{resp.error}</p>
      ) : null}

      {resp?.ok ? (
        <>
          <div className="card space-y-2">
            <h2 className="text-sm font-bold">
              Perbandingan harga — {resp.result.product}
            </h2>
            {resp.result.results.map((r, i) => {
              const isRec =
                rec &&
                rec.store === r.store &&
                rec.price === r.price;
              return (
                <a
                  key={i}
                  href={r.url ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`block rounded-xl px-3 py-2 ring-1 ${
                    isRec ? "bg-emerald-50 ring-emerald-300" : "bg-stone-50 ring-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {r.store} {isRec ? <span className="text-xs text-emerald-600">· rekomendasi</span> : null}
                    </span>
                    <span className="font-semibold">{formatForeign(r.price, resp.result.currency)}</span>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="card space-y-2">
            <h2 className="text-sm font-bold">Perkiraan biaya jastip</h2>
            {rec ? (
              <p className="text-xs text-stone-500">
                Harga paling masuk akal: {rec.store} —{" "}
                {formatForeign(rec.price, resp.result.currency)}
                {rec.reason ? <span className="block">({rec.reason})</span> : null}
              </p>
            ) : null}
            <div className="space-y-1 rounded-xl bg-stone-100 px-3 py-2 text-sm">
              <Row
                label={`Harga barang (${rec ? formatForeign(rec.price, resp.result.currency) : ""})`}
                value={formatIdr(resp.modalIdr)}
              />
              <Row label={`Fee jastip (${resp.markup}%)`} value={formatIdr(resp.feeIdr)} />
              <div className="flex justify-between border-t border-stone-200 pt-1 font-bold">
                <span>Total estimasi</span>
                <span>{formatIdr(resp.totalIdr)}</span>
              </div>
            </div>
            <p className="text-xs text-stone-500">
              Belum termasuk ongkir lokal. Harga final menyusul setelah barang dibeli.
            </p>
          </div>

          {rec ? (
            <form action={createClientOrderAction} className="card space-y-3">
              <h2 className="text-sm font-bold">Setuju & buat pesanan</h2>
              <input type="hidden" name="itemName" value={resp.result.product} />
              <input type="hidden" name="price" value={rec.price} />
              <input type="hidden" name="rate" value={resp.rate} />
              <input type="hidden" name="totalIdr" value={resp.totalIdr} />
              <input type="hidden" name="currency" value={resp.result.currency} />
              <input type="hidden" name="notes" value={`Dari ${rec.store}`} />
              <div>
                <label className="label">Nama kamu</label>
                <input
                  name="name"
                  className="input"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">No. WhatsApp</label>
                <input
                  name="phone"
                  className="input"
                  placeholder="62812..."
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <button className="btn btn-primary w-full" disabled={pending}>
                Buat pesanan
              </button>
            </form>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}
