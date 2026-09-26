import BottomNav from "@/components/nav";
import { logout } from "@/lib/actions";
import { getCurrentTrip, requireAuth } from "@/lib/session";
import { formatForeign } from "@/lib/format";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const trip = await getCurrentTrip();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-100/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {trip ? trip.name : "Jastip Tracker"}
            </p>
            <p className="truncate text-xs text-stone-500">
              {trip
                ? `${trip.country} · 1 ${trip.baseCurrency} = ${formatForeign(
                    Number(trip.rateUsed),
                    "IDR",
                  )}`
                : "Belum ada trip"}
            </p>
          </div>
          <form action={logout}>
            <button className="rounded-lg px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-200">
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <BottomNav />
    </div>
  );
}
