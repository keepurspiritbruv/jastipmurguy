import Link from "next/link";
import { togglePaidAction } from "@/lib/actions";
import { formatForeign, formatIdr } from "@/lib/format";
import { tripStats } from "@/lib/money";
import { listClientOrders, listOrders } from "@/lib/queries";
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

  const orders = trip ? await listOrders(trip.id, undefined, unpaidOnly) : [];
  const stats = tripStats(orders);

  return (
    <div className="animate-in space-y-4">
      {scanned ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Barang dari struk tersimpan. Jangan lupa isi harga jualnya.
        </p>
      ) : null}

      {clientOrders.length > 0 ? (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-stone-500">
            📥 Pesanan masuk dari klien ({clientOrders.length})
          </h2>
          <div className="space-y-2">
            {clientOrders.map((order) => (
              <div key={order.id} className="card ring-1 ring-emerald-200">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/pesanan/${order.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {order.itemName}{" "}
                      <span className="badge bg-emerald-100 text-emerald-700">dari klien</span>
                    </p>
                    <p className="text-xs text-stone-500">
                      {order.customerName ?? "Tanpa nama"} ·{" "}
                      {formatForeign(order.unitCostForeign, order.foreignCurrency)} ·{" "}
                      {order.notes ?? ""}
                    </p>
                  </Link>
                  <div className="text-right">
                    <p className="font-semibold">{formatIdr(order.sellPriceIdr)}</p>
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
            ))}
          </div>
        </section>
      ) : null}

      {trip ? (
        <>
          <div className="flex gap-2">
            <Link
              href="/pesanan"
              className={`badge px-3 py-1 ${!unpaidOnly ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-600"}`}
            >
              Semua ({!unpaidOnly ? orders.length : stats.orders})
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

          {orders.length === 0 ? (
            <p className="card text-sm text-stone-500">Belum ada pesanan di trip ini.</p>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div key={order.id} className="card">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/pesanan/${order.id}`} className="min-w-0 flex-1">
                      <p className="truncate font-medium">{order.itemName}</p>
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
              ))}
            </div>
          )}

          <Link href="/pesanan/baru" className="btn btn-primary w-full">
            + Tambah pesanan
          </Link>
        </>
      ) : (
        <div className="card text-center">
          <p className="text-sm text-stone-500">Belum ada trip untuk pesanan manual.</p>
          <Link href="/trip/baru" className="btn btn-primary mt-3 w-full">
            Buat trip
          </Link>
        </div>
      )}
    </div>
  );
}
