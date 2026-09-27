import Link from "next/link";
import { buyOrderAction, togglePaidAction } from "@/lib/actions";
import { formatForeign, formatIdr } from "@/lib/format";
import { tripStats } from "@/lib/money";
import { listClientOrders, listOrders, listPendingOrders } from "@/lib/queries";
import { getCurrentTrip } from "@/lib/session";

export default async function PesananPage({
  searchParams,
}: {
  searchParams: Promise<{ belum?: string; scanned?: string }>;
}) {
  const { belum, scanned } = await searchParams;
  const unpaidOnly = belum === "1";
  const trip = await getCurrentTrip();
  const clientOrders = await listClientOrders();
  const pendingCount = (await listPendingOrders()).length;

  const orders = trip ? await listOrders(trip.id) : [];
  let all = [...clientOrders, ...orders].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  if (unpaidOnly) all = all.filter((o) => !o.paid);
  const stats = tripStats(all);

  if (!trip && clientOrders.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-sm text-stone-500">Buat trip dulu untuk mencatat pesanan.</p>
        <Link href="/trip/baru" className="btn btn-primary mt-3 w-full">
          Buat trip
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-4">
      {scanned ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Barang dari struk tersimpan. Jangan lupa isi harga jualnya.
        </p>
      ) : null}

      {pendingCount > 0 ? (
        <Link
          href="/pesanan-masuk"
          className="card flex items-center justify-between ring-1 ring-amber-200"
        >
          <span className="text-sm font-semibold">
            📥 {pendingCount} pesanan menunggu review
          </span>
          <span className="text-xs font-medium text-amber-600">Review →</span>
        </Link>
      ) : null}

      <div className="flex gap-2">
        <Link
          href="/pesanan"
          className={`badge px-3 py-1 ${!unpaidOnly ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"}`}
        >
          Semua ({all.length})
        </Link>
        <Link
          href="/pesanan?belum=1"
          className={`badge px-3 py-1 ${unpaidOnly ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"}`}
        >
          Belum lunas
        </Link>
      </div>

      {unpaidOnly ? (
        <p className="px-1 text-sm text-stone-500">
          Total belum lunas:{" "}
          <span className="font-semibold text-amber-600">{formatIdr(stats.outstandingIdr)}</span>
        </p>
      ) : null}

      {all.length === 0 ? (
        <p className="card text-sm text-stone-500">Belum ada pesanan.</p>
      ) : (
        <div className="space-y-2">
          {all.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/pesanan/${order.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {order.itemName}
                    {order.source === "client" ? (
                      <span className="badge ml-1 bg-emerald-100 text-emerald-700">dari klien</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-stone-500">
                    {order.customerName ?? "Tanpa nama"} · {order.qty}×{" "}
                    {formatForeign(order.unitCostForeign, order.foreignCurrency)}
                  </p>
                  <p className="mt-1 text-[11px] text-stone-400">
                    {order.category} · modal {formatIdr(order.costIdr)}
                  </p>
                </Link>
                <div className="text-right">
                  <p className="font-semibold">{formatIdr(order.sellPriceIdr)}</p>
                  <div className="mt-1 flex flex-col items-end gap-1">
                    {order.bought ? (
                      <span className="badge bg-blue-100 text-blue-700">Dibeli</span>
                    ) : null}
                    {order.paid ? (
                      <span className="badge bg-emerald-100 text-emerald-700">Lunas</span>
                    ) : (
                      <form action={togglePaidAction}>
                        <input type="hidden" name="id" value={order.id} />
                        <input type="hidden" name="paid" value="1" />
                        <button className="badge bg-amber-100 text-amber-700">Tandai lunas</button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
              {order.source === "client" && !order.bought ? (
                <form action={buyOrderAction} className="mt-2">
                  <input type="hidden" name="id" value={order.id} />
                  <button className="btn btn-ghost w-full py-1.5 text-xs">
                    ✓ Tandai sudah dibeli
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {trip ? (
        <Link href="/pesanan/baru" className="btn btn-primary w-full">
          + Tambah pesanan
        </Link>
      ) : null}
    </div>
  );
}
