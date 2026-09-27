"use client";

import { useState } from "react";
import { submitPaymentProofAction } from "@/lib/actions";
import { downscaleImage } from "@/lib/downscale";

export default function PaymentUpload({ orderId }: { orderId: number }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  async function onPick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setErr("");
    try {
      const small = await downscaleImage(file);
      const res = await submitPaymentProofAction(orderId, small);
      if (res.ok) setDone(true);
      else setErr(res.error);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mt-4 space-y-3">
      <p className="text-sm font-semibold">Kirim bukti pembayaran</p>
      <label className="btn btn-primary w-full cursor-pointer">
        {busy ? "Mengunggah..." : "Unggah screenshot bukti transfer"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          disabled={busy}
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </label>
      {done ? <p className="text-sm text-emerald-700">Bukti terkirim. Terima kasih!</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </div>
  );
}
