import Link from "next/link";
import ScanClient from "@/components/scan-client";
import { getCurrentTrip } from "@/lib/session";

export default async function ScanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const trip = await getCurrentTrip();

  if (!trip) {
    return (
      <div className="card text-center">
        <p className="text-sm text-stone-500">Buat trip dulu untuk scan struk.</p>
        <Link href="/trip/baru" className="btn btn-primary mt-3 w-full">
          Buat trip
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in space-y-4">
      <h1 className="px-1 text-lg font-bold">Scan struk</h1>
      <ScanClient
        trip={{ id: trip.id, baseCurrency: trip.baseCurrency, rateUsed: trip.rateUsed }}
        error={error === "1"}
      />
    </div>
  );
}
