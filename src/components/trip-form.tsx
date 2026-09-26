"use client";

import { useState, useTransition } from "react";
import { createTripAction, getRateAction } from "@/lib/actions";
import { CURRENCIES } from "@/lib/categories";
import { formatIdr } from "@/lib/format";

export default function TripForm() {
  const [currency, setCurrency] = useState("JPY");
  const [rate, setRate] = useState("");
  const [loading, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function fetchRate(cur: string) {
    setMessage(null);
    start(async () => {
      const res = await getRateAction(cur);
      if (res.ok) {
        setRate(String(res.rate));
        setMessage(`Kurs live: 1 ${cur} = ${formatIdr(res.rate)}`);
      } else {
        setMessage(res.error);
      }
    });
  }

  return (
    <form action={createTripAction} className="space-y-4">
      <div className="card space-y-3">
        <div>
          <label className="label">Nama trip</label>
          <input name="name" className="input" placeholder="Jepang Okt 2026" required />
        </div>
        <div>
          <label className="label">Negara</label>
          <input name="country" className="input" placeholder="Jepang" required />
        </div>
        <div>
          <label className="label">Mata uang utama</label>
          <select
            name="baseCurrency"
            className="input"
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setRate("");
              setMessage(null);
            }}
          >
            {CURRENCIES.filter((c) => c.code !== "IDR").map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Kurs yang dipakai (1 {currency} = ? IDR)</label>
          <div className="flex gap-2">
            <input
              name="rateUsed"
              className="input"
              inputMode="decimal"
              placeholder="110"
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
              {loading ? "..." : "Kurs live"}
            </button>
          </div>
          {message ? <p className="mt-1 text-xs text-emerald-700">{message}</p> : null}
          <p className="mt-1 text-xs text-stone-500">
            Kurs money changer biasanya beda tipis — boleh diubah manual.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Mulai</label>
            <input name="startDate" type="date" className="input" />
          </div>
          <div>
            <label className="label">Selesai</label>
            <input name="endDate" type="date" className="input" />
          </div>
        </div>
      </div>
      <button className="btn btn-primary w-full" disabled={loading}>
        Simpan trip
      </button>
    </form>
  );
}
