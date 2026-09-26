import { redirect } from "next/navigation";
import { login } from "@/lib/actions";
import { isAuthed } from "@/lib/session";

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/dasbor");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col justify-center bg-gradient-to-b from-emerald-700 to-emerald-900 px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl">
            🧳
          </div>
          <h1 className="text-2xl font-bold">Jastip Tracker</h1>
          <p className="mt-1 text-sm text-emerald-100">
            Catat pesanan & margin langsung dari toko
          </p>
        </div>
        <form action={login} className="card space-y-4">
          <div>
            <label className="label" htmlFor="passcode">
              Kode akses
            </label>
            <input
              id="passcode"
              name="passcode"
              type="password"
              inputMode="text"
              autoComplete="current-password"
              className="input"
              placeholder="••••••"
              autoFocus
              required
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error === "2"
                ? "Terlalu banyak percobaan. Coba lagi beberapa menit lagi."
                : "Kode akses salah. Coba lagi."}
            </p>
          ) : null}
          <button className="btn btn-primary w-full" type="submit">
            Masuk
          </button>
        </form>
      </div>
    </main>
  );
}
