import { setCurrentTrip } from "@/lib/actions";
import { listTrips } from "@/lib/queries";

export default async function TripSwitcher({ currentId }: { currentId: number | null }) {
  const trips = await listTrips();
  if (trips.length <= 1) return null;

  return (
    <form action={setCurrentTrip} className="flex items-center gap-2">
      <select name="tripId" defaultValue={currentId ?? undefined} className="input flex-1">
        {trips.map((trip) => (
          <option key={trip.id} value={trip.id}>
            {trip.name} ({trip.country})
          </option>
        ))}
      </select>
      <button className="btn btn-ghost shrink-0">Ganti</button>
    </form>
  );
}
