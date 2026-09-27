import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-gradient-to-b from-emerald-700 to-emerald-900 px-6">
      <div className="mx-auto w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-4xl">
          🧳
        </div>
        <h1 className="text-3xl font-bold text-white">JastipMurGuy</h1>
        <p className="mt-1 text-sm text-emerald-100">
          Titip beli dari Jepang, transparan tanpa biaya tersembunyi.
        </p>
        <div className="mt-8 space-y-3">
          <Link href="/cari" className="btn btn-primary w-full py-3 text-base">
            🔍 Cek Harga Jastip
          </Link>
          <Link
            href="/masuk"
            className="btn w-full py-3 text-base text-white ring-1 ring-white/30 hover:bg-white/10"
          >
            🔐 Admin / Murguy
          </Link>
        </div>
        <p className="mt-8 text-xs text-emerald-200/70">
          Kurs live JPY → IDR · fee 10% flat
        </p>
      </div>
    </main>
  );
}
