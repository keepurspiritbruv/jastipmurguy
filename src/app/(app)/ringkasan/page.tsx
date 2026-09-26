import Link from "next/link";
import { formatIdr, formatPct, waLink } from "@/lib/format";
import { groupRevenue, tripStats } from "@/lib/money";
import { listOrders } from "@/lib/queries";
import { getCurrentTrip } from "@/lib/session";

export default async function RingkasanPage() {
  const trip = await getCurrentTrip();

  if (!trip) {
    return (
      <div className="card text-center">
        <p className="text-sm text-stone-500">Belum ada trip.</p>
        <Link href="/trip/baru" className="btn btn-primary mt-3 w-full">
          Buat trip
        </Link>
      </div>
    );
  }

  const orders = await listOrders(trip.id);
  const stats = tripStats(orders);
  const topCustomer = groupRevenue(orders, (o) => o.customerName)[0] ?? null;
  const topCategory = groupRevenue(orders, (o) => o.category)[0] ?? null;

  const share = [
    `📊 *Ringkasan Jastip — ${trip.name}*`,
    `🌏 ${trip.country}`,
    "",
    `🧾 Pesanan: ${stats.orders}`,
    `💰 Omzet: ${formatIdr(stats.revenueIdr)}`,
    `📦 Modal: ${formatIdr(stats.costIdr)}`,
    `📈 Margin: ${formatIdr(stats.marginIdr)} (${formatPct(stats.marginPct)})`,
    topCustomer ? `🏆 Pelanggan teratas: ${topCustomer.key} (${formatIdr(topCustomer.revenueIdr)})` : "",
    topCategory ? `⭐ Kategori terlaris: ${topCategory.key}` : "",
    "",
    `⏳ Belum lunas: ${formatIdr(stats.outstandingIdr)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="animate-in space-y-4">
      <div className="px-1">
        <h1 className="text-lg font-bold">Ringkasan trip</h1>
        <p className="text-xs text-stone-500">
          {trip.name} · {trip.country}
        </p>
      </div>

      <div className="card bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <p className="text-xs text-emerald-100">Margin bersih</p>
        <p className="text-3xl font-bold">{formatIdr(stats.marginIdr)}</p>
        <p className="mt-1 text-sm text-emerald-100">{formatPct(stats.marginPct)} dari omzet</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-stone-500">Omzet</p>
          <p className="text-lg font-bold">{formatIdr(stats.revenueIdr)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-stone-500">Modal</p>
          <p className="text-lg font-bold">{formatIdr(stats.costIdr)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-stone-500">Pesanan</p>
          <p className="text-lg font-bold">{stats.orders}</p>
        </div>
        <div className="card">
          <p className="text-xs text-stone-500">Belum lunas</p>
          <p className="text-lg font-bold text-amber-600">{formatIdr(stats.outstandingIdr)}</p>
        </div>
      </div>

      <div className="card space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-stone-500">🏆 Pelanggan teratas</span>
          <span className="text-sm font-semibold">{topCustomer ? topCustomer.key : "-"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-stone-500">⭐ Kategori terlaris</span>
          <span className="text-sm font-semibold">{topCategory ? topCategory.key : "-"}</span>
        </div>
      </div>

      <a
        href={waLink(share)}
        target="_blank"
        rel="noreferrer"
        className="btn btn-primary w-full"
      >
        Bagikan ke WhatsApp
      </a>

      <div className="flex gap-2">
        <Link href="/trip" className="btn btn-ghost flex-1">
          Kelola trip
        </Link>
        <Link href="/pelanggan" className="btn btn-ghost flex-1">
          Tagihan pelanggan
        </Link>
      </div>
    </div>
  );
}
