"use client";

import { useState, useTransition } from "react";
import { getRateAction, saveOrderAction } from "@/lib/actions";
import { CATEGORIES, CURRENCIES } from "@/lib/categories";
import { formatForeign, formatIdr } from "@/lib/format";
import { lineCostIdr } from "@/lib/money";

type OrderInput = {
  id: number;
  customerName: string | null;
  itemName: string;
  category: string;
  qty: number;
  foreignCurrency: string;
  unitCostForeign: number;
  rateUsed: number;
  sellPriceIdr: number;
  notes: string | null;
};

export default function OrderForm({
  trip,
  customers,
  order,
  error,
}: {
  trip: { id: number; baseCurrency: string; rateUsed: string };
  customers: { id: number; name: string }[];
  order?: OrderInput | null;
  error?: boolean;
}) {
  const [currency, setCurrency] = useState(order?.foreignCurrency ?? trip.baseCurrency);
  const [unitCost, setUnitCost] = useState(order ? String(order.unitCostForeign) : "");
  const [qty, setQty] = useState(order ? String(order.qty) : "1");
  const [rate, setRate] = useState(order ? String(order.rateUsed) : trip.rateUsed);
  const [sell, setSell] = useState(order ? String(order.sellPriceIdr) : "");
  const [note, setNote] = useState<string | null>(null);
  const [loading, start] = useTransition();

  const costPreview = lineCostIdr(
    Number(unitCost) || 0,
    Number(qty) || 0,
    Number(rate) || 0,
  );
  const sellNum = Number(sell.replace(/[^\d]/g, "")) || 0;
  const marginNum = sellNum - costPreview;

  function fetchRate(cur: string) {
    setNote(null);
    start(async () => {
      const res = await getRateAction(cur);
      if (res.ok) {
        setRate(String(res.rate));
        setNote(`Kurs live: 1 ${cur} = ${formatIdr(res.rate)}`);
      } else {
        setNote(res.error);
      }
    });
  }

  return (
    <form action={saveOrderAction} className="space-y-4">
      {order ? <input type="hidden" name="orderId" value={order.id} /> : null}
      <input type="hidden" name="tripId" value={trip.id} />

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Data belum lengkap. Periksa barang, mata uang, harga, dan kurs.
        </p>
      ) : null}

      <div className="card space-y-3">
        <div>
          <label className="label">Nama pelanggan</label>
          <input
            name="customerName"
            className="input"
            placeholder="Bu Sri"
            defaultValue={order?.customerName ?? ""}
            list="customer-list"
          />
          <datalist id="customer-list">
            {customers.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label">No. WA pelanggan (opsional)</label>
          <input name="customerPhone" className="input" placeholder="62812..." inputMode="tel" />
        </div>
        <div>
          <label className="label">Barang</label>
          <input
            name="itemName"
            className="input"
            placeholder="Shiseido Anessa 60ml"
            defaultValue={order?.itemName ?? ""}
            required
          />
        </div>
        <div>
          <label className="label">Kategori</label>
          <select name="category" className="input" defaultValue={order?.category ?? "Skincare"}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Mata uang</label>
            <select
              name="foreignCurrency"
              className="input"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value);
                setNote(null);
              }}
            >
              {CURRENCIES.filter((c) => c.code !== "IDR").map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Jumlah (qty)</label>
            <input
              name="qty"
              className="input"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Harga satuan di toko ({currency})</label>
          <input
            name="unitCostForeign"
            className="input"
            inputMode="decimal"
            placeholder="2980"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Kurs dipakai (1 {currency} = ? IDR)</label>
          <div className="flex gap-2">
            <input
              name="rateUsed"
              className="input"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-ghost shrink-0"
              disabled={loading}
              onClick={() => fetchRate(currency)}
            >
              {loading ? "..." : "Kurs"}
            </button>
          </div>
          {note ? <p className="mt-1 text-xs text-emerald-700">{note}</p> : null}
        </div>
        <div className="rounded-xl bg-stone-100 px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Modal</span>
            <span className="font-semibold">{formatIdr(costPreview)}</span>
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="label">Harga jual ke pelanggan (IDR)</label>
          <input
            name="sellPriceIdr"
            className="input text-lg font-semibold"
            inputMode="numeric"
            placeholder="450000"
            value={sell}
            onChange={(e) => setSell(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm">
          <span className="text-emerald-700">Margin</span>
          <span className={`font-bold ${marginNum < 0 ? "text-red-600" : "text-emerald-700"}`}>
            {formatIdr(marginNum)}
          </span>
        </div>
        <div>
          <label className="label">Catatan (opsional)</label>
          <input
            name="notes"
            className="input"
            defaultValue={order?.notes ?? ""}
            placeholder="Warna coklat, ukuran M"
          />
        </div>
        <p className="text-xs text-stone-500">
          {qty || 0} × {formatForeign(Number(unitCost) || 0, currency)}
        </p>
      </div>

      <button className="btn btn-primary w-full" disabled={loading}>
        Simpan pesanan
      </button>
    </form>
  );
}
