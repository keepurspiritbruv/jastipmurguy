import Link from "next/link";
import { notFound } from "next/navigation";
import OrderForm from "@/components/order-form";
import { deleteOrderAction, togglePaidAction } from "@/lib/actions";
import { formatForeign, formatIdr } from "@/lib/format";
import { getOrder, getTrip, listCustomers } from "@/lib/queries";

export default async function PesananDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const order = await getOrder(Number(id));
  if (!order) notFound();

  const trip = await getTrip(order.tripId);
  if (!trip) notFound();
  const customers = await listCustomers();
  const customerName =
    customers.find((c) => c.id === order.customerId)?.name ?? null;

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Link href="/pesanan" className="text-sm text-stone-500">
          ← Pesanan
        </Link>
        <h1 className="text-lg font-bold">Ubah pesanan</h1>
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-stone-500">Total toko</p>
          <p className="font-semibold">
            {formatForeign(Number(order.unitCostForeign), order.foreignCurrency)} × {order.qty}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500">Modal tercatat</p>
          <p className="font-semibold">{formatIdr(order.costIdr)}</p>
        </div>
      </div>

      <OrderForm
        trip={{ id: trip.id, baseCurrency: trip.baseCurrency, rateUsed: trip.rateUsed }}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        order={{
          id: order.id,
          customerName,
          itemName: order.itemName,
          category: order.category,
          qty: order.qty,
          foreignCurrency: order.foreignCurrency,
          unitCostForeign: Number(order.unitCostForeign),
          rateUsed: Number(order.rateUsed),
          sellPriceIdr: order.sellPriceIdr,
          notes: order.notes,
        }}
        error={error === "1"}
      />

      <div className="flex gap-2">
        <form action={togglePaidAction} className="flex-1">
          <input type="hidden" name="id" value={order.id} />
          <input type="hidden" name="paid" value={order.paid ? "0" : "1"} />
          <button className="btn btn-ghost w-full">
            {order.paid ? "Tandai belum lunas" : "Tandai lunas"}
          </button>
        </form>
        <form action={deleteOrderAction} className="flex-1">
          <input type="hidden" name="id" value={order.id} />
          <button className="btn btn-danger w-full">Hapus</button>
        </form>
      </div>
    </div>
  );
}
