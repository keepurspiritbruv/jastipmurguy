import Link from "next/link";
import { addCustomerAction, markCustomerPaidAction } from "@/lib/actions";
import { formatIdr, waLink } from "@/lib/format";
import { allOrders, listCustomers } from "@/lib/queries";

export default async function PelangganPage() {
  const customers = await listCustomers();
  const orders = await allOrders();

  const rows = customers
    .map((customer) => {
      const mine = orders.filter((o) => o.customerId === customer.id);
      const unpaid = mine.filter((o) => !o.paid);
      return {
        customer,
        orders: mine,
        unpaid,
        outstanding: unpaid.reduce((t, o) => t + o.sellPriceIdr, 0),
        revenue: mine.reduce((t, o) => t + o.sellPriceIdr, 0),
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding || b.revenue - a.revenue);

  const totalOutstanding = rows.reduce((t, r) => t + r.outstanding, 0);
  const proofOrders = orders.filter((o) => o.paymentProof);

  return (
    <div className="animate-in space-y-4">
      <h1 className="px-1 text-lg font-bold">Pelanggan</h1>

      <div className="card flex items-center justify-between">
        <span className="text-sm text-stone-500">Total belum lunas</span>
        <span className="text-lg font-bold text-amber-600">{formatIdr(totalOutstanding)}</span>
      </div>

      {proofOrders.length > 0 ? (
        <section className="space-y-2">
          <h2 className="px-1 text-sm font-semibold text-stone-500">
            🧾 Bukti pembayaran ({proofOrders.length})
          </h2>
          {proofOrders.map((o) => (
            <div key={o.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {o.customerName ?? "Tanpa nama"} — {o.itemName}
                </p>
                <p className="text-sm font-semibold">{formatIdr(o.sellPriceIdr)}</p>
              </div>
              <a href={o.paymentProof!} target="_blank" rel="noreferrer">
                <img
                  src={o.paymentProof!}
                  alt="Bukti pembayaran"
                  className="max-h-64 w-full rounded-xl object-contain ring-1 ring-stone-200"
                />
              </a>
              <p className="text-xs text-stone-400">Ketuk gambar untuk perbesar.</p>
            </div>
          ))}
        </section>
      ) : null}

      <details className="card">
        <summary className="cursor-pointer text-sm font-semibold">+ Tambah pelanggan</summary>
        <form action={addCustomerAction} className="mt-3 space-y-2">
          <input name="name" className="input" placeholder="Nama pelanggan" required />
          <input name="phone" className="input" placeholder="No. WA (opsional)" inputMode="tel" />
          <button className="btn btn-primary w-full">Simpan</button>
        </form>
      </details>

      {rows.length === 0 ? (
        <p className="card text-sm text-stone-500">Belum ada pelanggan.</p>
      ) : (
        rows.map(({ customer, orders: mine, unpaid, outstanding, revenue }) => {
          const invoice = [
            `Halo ${customer.name}! Berikut tagihan jastip kamu:`,
            ...unpaid.map(
              (o) => `• ${o.itemName} ×${o.qty} — ${formatIdr(o.sellPriceIdr)}`,
            ),
            "",
            `Total belum lunas: ${formatIdr(outstanding)}`,
          ].join("\n");

          return (
            <div key={customer.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-xs text-stone-500">
                    {mine.length} pesanan · omzet {formatIdr(revenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-500">Belum lunas</p>
                  <p className={`font-bold ${outstanding > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {formatIdr(outstanding)}
                  </p>
                </div>
              </div>

              {unpaid.length > 0 ? (
                <ul className="space-y-1 text-sm text-stone-600">
                  {unpaid.slice(0, 4).map((o) => (
                    <li key={o.id} className="flex justify-between">
                      <span className="truncate pr-2">{o.itemName}</span>
                      <span>{formatIdr(o.sellPriceIdr)}</span>
                    </li>
                  ))}
                  {unpaid.length > 4 ? (
                    <li className="text-xs text-stone-400">+{unpaid.length - 4} lainnya</li>
                  ) : null}
                </ul>
              ) : (
                <p className="text-sm text-emerald-700">Semua lunas 🎉</p>
              )}

              <div className="flex gap-2">
                <a
                  href={waLink(invoice, customer.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost flex-1"
                >
                  Kirim tagihan WA
                </a>
                {unpaid.length > 0 ? (
                  <form action={markCustomerPaidAction}>
                    <input type="hidden" name="ids" value={unpaid.map((o) => o.id).join(",")} />
                    <button className="btn btn-primary">Lunasi semua</button>
                  </form>
                ) : null}
              </div>
            </div>
          );
        })
      )}

      <Link href="/pesanan?belum=1" className="btn btn-ghost w-full">
        Lihat semua pesanan belum lunas
      </Link>
    </div>
  );
}
