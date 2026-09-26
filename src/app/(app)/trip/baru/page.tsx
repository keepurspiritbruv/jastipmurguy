import Link from "next/link";
import TripForm from "@/components/trip-form";

export default function TripBaruPage() {
  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center gap-2 px-1">
        <Link href="/trip" className="text-sm text-stone-500">
          ← Trip
        </Link>
        <h1 className="text-lg font-bold">Trip baru</h1>
      </div>
      <TripForm />
    </div>
  );
}
