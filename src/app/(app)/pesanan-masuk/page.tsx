import Link from "next/link";
import { acceptOrderAction, rejectOrderAction } from "@/lib/actions";
import { formatForeign, formatIdr } from "@/lib/format";
import { listPendingOrders } from "@/lib/queries";

export default async function PesananMasukPage() {
  const pending = await listPendingOrders();

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Link href="/pesanan" className="text-sm text-stone-500">
          ← Pesanan
        </Link>
        <h1 className="text-lg font-bold">Pesanan masuk</h1>
      </div>

      {pending.length === 0 ? (
        <div className="card text-center">
          <p className="text-3xl">🎉</p>
          <p className="mt-2 text-sm text-stone-500">Tidak ada pesanan menunggu review.</p>
        </div>
      ) : (
        <p className="px-1 text-sm text-stone-500">{pending.length} pesanan menunggu keputusan.</p>
      )}

      {pending.map((order) => (
        <div key={order.id} className="card space-y-3">
          <div>
            <p className="font-medium">{order.itemName}</p>
            <p className="text-xs text-stone-500">
              {order.customerName ?? "Tanpa nama"} ·{" "}
              {formatForeign(order.unitCostForeign, order.foreignCurrency)}
            </p>
            {order.notes ? <p className="mt-1 text-xs text-stone-400">{order.notes}</p> : null}
          </div>
          <div className="flex items-center justify-between rounded-xl bg-stone-100 px-3 py-2 text-sm">
            <span className="text-stone-500">Harga jual (sudah + fee)</span>
            <span className="font-semibold">{formatIdr(order.sellPriceIdr)}</span>
          </div>
          <div className="flex gap-2">
            <form action={acceptOrderAction} className="flex-1">
              <input type="hidden" name="id" value={order.id} />
              <button className="btn btn-primary w-full">Terima</button>
            </form>
            <form action={rejectOrderAction} className="flex-1">
              <input type="hidden" name="id" value={order.id} />
              <button className="btn btn-danger w-full">Tolak</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
