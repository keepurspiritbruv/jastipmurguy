import Link from "next/link";
import TripSwitcher from "@/components/trip-switcher";
import AdminSubscribe from "@/components/admin-subscribe";
import { formatIdr, formatPct } from "@/lib/format";
import { groupRevenue, tripStats } from "@/lib/money";
import { listOrders } from "@/lib/queries";
import { getCurrentTrip } from "@/lib/session";

export default async function DasborPage() {
  const trip = await getCurrentTrip();

  if (!trip) {
    return (
      <div className="card animate-in text-center">
        <p className="text-3xl">🧳</p>
        <h2 className="mt-2 text-lg font-bold">Belum ada trip</h2>
        <p className="mt-1 text-sm text-stone-500">
          Buat trip pertama untuk mulai mencatat pesanan.
        </p>
        <Link href="/trip/baru" className="btn btn-primary mt-4 w-full">
          Buat trip
        </Link>
      </div>
    );
  }

  const orders = await listOrders(trip.id);
  const stats = tripStats(orders);
  const perCustomer = groupRevenue(orders, (o) => o.customerName).slice(0, 5);
  const perCategory = groupRevenue(orders, (o) => o.category).slice(0, 3);
  const recent = orders.slice(0, 5);

  return (
    <div className="animate-in space-y-4">
      <TripSwitcher currentId={trip.id} />
      <AdminSubscribe />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Pesanan" value={String(stats.orders)} />
        <Stat label="Margin" value={formatIdr(stats.marginIdr)} accent />
        <Stat label="Omzet" value={formatIdr(stats.revenueIdr)} />
        <Stat label="Modal" value={formatIdr(stats.costIdr)} />
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-500">Margin</p>
          <p className="text-lg font-bold">{formatPct(stats.marginPct)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">Belum lunas</p>
          <p className="text-lg font-bold text-amber-600">{formatIdr(stats.outstandingIdr)}</p>
        </div>
      </div>

      <Link href="/pesanan/baru" className="btn btn-primary w-full">
        + Tambah pesanan
      </Link>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-stone-500">Per pelanggan</h2>
        {perCustomer.length === 0 ? (
          <p className="card text-sm text-stone-500">Belum ada data.</p>
        ) : (
          <div className="card divide-y divide-stone-100">
            {perCustomer.map((row) => (
              <div key={row.key} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{row.key}</p>
                  <p className="text-xs text-stone-500">
                    {row.orders} pesanan · margin {formatIdr(row.marginIdr)}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatIdr(row.revenueIdr)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-stone-500">Kategori terlaris</h2>
        <div className="card space-y-2">
          {perCategory.length === 0 ? (
            <p className="text-sm text-stone-500">Belum ada data.</p>
          ) : (
            perCategory.map((row, i) => (
              <div key={row.key} className="flex items-center justify-between">
                <span className="text-sm">
                  {i === 0 ? "🥇 " : i === 1 ? "🥈 " : "🥉 "}
                  {row.key}
                </span>
                <span className="text-sm font-semibold">{formatIdr(row.revenueIdr)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-stone-500">Pesanan terbaru</h2>
        {recent.length === 0 ? (
          <p className="card text-sm text-stone-500">Belum ada pesanan.</p>
        ) : (
          <div className="card divide-y divide-stone-100">
            {recent.map((order) => (
              <Link
                key={order.id}
                href={`/pesanan/${order.id}`}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{order.itemName}</p>
                  <p className="text-xs text-stone-500">{order.customerName ?? "Tanpa nama"}</p>
                </div>
                <span className="text-sm font-semibold">{formatIdr(order.sellPriceIdr)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card">
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${accent ? "text-emerald-700" : ""}`}>{value}</p>
    </div>
  );
}
