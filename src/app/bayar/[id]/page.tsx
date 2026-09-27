import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PaymentUpload from "@/components/payment-upload";
import { formatForeign, formatIdr } from "@/lib/format";
import { getOrder } from "@/lib/queries";

export const metadata: Metadata = { title: "Pembayaran" };

export default async function BayarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(Number(id));
  if (!order) notFound();

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <h1 className="text-lg font-bold">Pembayaran</h1>
      <p className="text-sm text-stone-500">{order.itemName}</p>

      <div className="card mt-4 space-y-1">
        <p className="text-sm text-stone-500">
          Total yang harus dibayar ({formatForeign(Number(order.unitCostForeign), order.foreignCurrency)}):
        </p>
        <p className="text-2xl font-bold">{formatIdr(order.sellPriceIdr)}</p>
      </div>

      <div className="card mt-4 space-y-1">
        <p className="text-sm font-semibold">Transfer ke rekening:</p>
        <p className="text-sm">Bank Mandiri</p>
        <p className="text-xl font-bold tracking-wide">1370020439358</p>
        <p className="text-sm">a.n. Dhimas Nurhanindya Putra</p>
      </div>

      <PaymentUpload orderId={order.id} />
    </main>
  );
}
