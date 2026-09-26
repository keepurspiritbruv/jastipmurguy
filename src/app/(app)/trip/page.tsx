import Link from "next/link";
import { setCurrentTrip, updateTripAction } from "@/lib/actions";
import { formatForeign, formatIdr } from "@/lib/format";
import { listTrips } from "@/lib/queries";
import { getCurrentTrip } from "@/lib/session";

export default async function TripPage() {
  const trips = await listTrips();
  const current = await getCurrentTrip();

  return (
    <div className="animate-in space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-lg font-bold">Trip</h1>
        <Link href="/trip/baru" className="btn btn-primary px-3 py-1.5 text-xs">
          + Trip baru
        </Link>
      </div>

      {trips.length === 0 ? (
        <p className="card text-sm text-stone-500">Belum ada trip.</p>
      ) : null}

      {trips.map((trip) => {
        const isCurrent = current?.id === trip.id;
        return (
          <div key={trip.id} className={`card space-y-3 ${isCurrent ? "ring-2 ring-emerald-500" : ""}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">
                  {trip.name} {isCurrent ? <span className="badge bg-emerald-100 text-emerald-700">aktif</span> : null}
                </p>
                <p className="text-xs text-stone-500">
                  {trip.country} · 1 {trip.baseCurrency} = {formatForeign(Number(trip.rateUsed), "IDR")}
                </p>
              </div>
              <span
                className={`badge ${
                  trip.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-200 text-stone-600"
                }`}
              >
                {trip.status === "active" ? "berjalan" : "selesai"}
              </span>
            </div>

            <form action={updateTripAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={trip.id} />
              <div className="flex-1">
                <label className="label">Kurs (1 {trip.baseCurrency} = ? IDR)</label>
                <input
                  name="rateUsed"
                  className="input"
                  inputMode="decimal"
                  defaultValue={Number(trip.rateUsed)}
                />
              </div>
              <div className="flex-1">
                <label className="label">Status</label>
                <select name="status" className="input" defaultValue={trip.status}>
                  <option value="active">Berjalan</option>
                  <option value="closed">Selesai</option>
                </select>
              </div>
              <button className="btn btn-ghost">Simpan</button>
            </form>

            <div className="flex gap-2">
              {!isCurrent ? (
                <form action={setCurrentTrip} className="flex-1">
                  <input type="hidden" name="tripId" value={trip.id} />
                  <button className="btn btn-ghost w-full">Pakai trip ini</button>
                </form>
              ) : null}
              <Link href="/ringkasan" className="btn btn-ghost flex-1">
                Ringkasan
              </Link>
            </div>
            <p className="text-xs text-stone-500">
              Total harga belanja tersimpan di IDR: kurs di atas dipakai sebagai default order baru.
            </p>
          </div>
        );
      })}
    </div>
  );
}
