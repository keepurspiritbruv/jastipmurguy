"use client";

import { useState } from "react";
import { saveAdminSubscriptionAction } from "@/lib/actions";
import { enableNotifications } from "@/lib/push-client";

export default function AdminSubscribe() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "err">("idle");

  async function enable() {
    setState("busy");
    const sub = await enableNotifications();
    if (!sub) {
      setState("err");
      return;
    }
    const res = await saveAdminSubscriptionAction(sub);
    setState(res.ok ? "done" : "err");
  }

  return (
    <div className="card space-y-2">
      <p className="text-sm font-semibold">🔔 Notifikasi pesanan baru</p>
      <p className="text-xs text-stone-500">
        Aktifkan supaya dapat notifikasi di HP saat ada pesanan klien masuk.
      </p>
      {state === "done" ? (
        <p className="text-sm font-medium text-emerald-700">Notifikasi aktif ✓</p>
      ) : (
        <button
          className="btn btn-primary w-full"
          disabled={state === "busy"}
          onClick={enable}
        >
          {state === "busy" ? "Mengaktifkan..." : "Aktifkan notifikasi"}
        </button>
      )}
      {state === "err" ? (
        <p className="text-xs text-red-600">
          Gagal. Pastikan browser HP mengizinkan notifikasi.
        </p>
      ) : null}
    </div>
  );
}
