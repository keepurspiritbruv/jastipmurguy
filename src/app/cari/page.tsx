import type { Metadata } from "next";
import SearchClient from "@/components/search-client";

export const metadata: Metadata = {
  title: "Cek Harga Jastip",
};

export default async function CariPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { ok, error } = await searchParams;
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <SearchClient ok={ok === "1"} error={error} />
      <p className="mt-6 text-center text-xs text-stone-400">
        JastipMurGuy · transparan, tanpa biaya tersembunyi
      </p>
    </main>
  );
}
