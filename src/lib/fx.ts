type Cached = { rate: number; at: number };

const CACHE_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, Cached>();

export type RateResult = { rate: number; source: "identity" | "live" | "cache" };

export async function rateToIdr(currency: string): Promise<RateResult> {
  const cur = currency.trim().toUpperCase();
  if (cur === "IDR") return { rate: 1, source: "identity" };

  const hit = cache.get(cur);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return { rate: hit.rate, source: "cache" };
  }

  const res = await fetch(`https://open.er-api.com/v6/latest/${cur}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Gagal mengambil kurs ${cur}`);
  const json = (await res.json()) as { rates?: Record<string, number> };
  const rate = json.rates?.IDR;
  if (!rate || !Number.isFinite(rate)) {
    throw new Error(`Kurs ${cur} ke IDR tidak tersedia`);
  }
  cache.set(cur, { rate, at: Date.now() });
  return { rate, source: "live" };
}
