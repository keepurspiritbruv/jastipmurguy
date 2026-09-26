import Link from "next/link";
import OrderForm from "@/components/order-form";
import { listCustomers } from "@/lib/queries";
import { getCurrentTrip } from "@/lib/session";

export default async function PesananBaruPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const trip = await getCurrentTrip();

  if (!trip) {
    return (
      <div className="card text-center">
        <p className="text-sm text-stone-500">Buat trip dulu.</p>
        <Link href="/trip/baru" className="btn btn-primary mt-3 w-full">
          Buat trip
        </Link>
      </div>
    );
  }

  const customers = await listCustomers();

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Link href="/pesanan" className="text-sm text-stone-500">
          ← Pesanan
        </Link>
        <h1 className="text-lg font-bold">Pesanan baru</h1>
      </div>
      <OrderForm
        trip={{ id: trip.id, baseCurrency: trip.baseCurrency, rateUsed: trip.rateUsed }}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        error={error === "1"}
      />
    </div>
  );
}
