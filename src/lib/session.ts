import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifyToken } from "./auth";
import { getDefaultTrip, getTrip } from "./queries";

const TRIP_COOKIE = "jastip_trip";

export async function isAuthed() {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireAuth() {
  if (!(await isAuthed())) redirect("/masuk");
}

export async function getCurrentTrip() {
  const store = await cookies();
  const id = Number(store.get(TRIP_COOKIE)?.value);
  if (id) {
    const trip = await getTrip(id);
    if (trip) return trip;
  }
  return getDefaultTrip();
}
