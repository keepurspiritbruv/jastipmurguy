import { z } from "zod";
import { extractJson } from "./parse-json";

const SearchSchema = z.object({
  product: z.string().optional(),
  currency: z.string().optional(),
  results: z
    .array(
      z.object({
        store: z.string(),
        price: z.number(),
        url: z.string().nullish(),
      }),
    )
    .default([]),
  recommended: z
    .object({
      store: z.string(),
      price: z.number(),
      reason: z.string().nullish(),
    })
    .nullish(),
});

export type SearchResult = {
  product: string;
  currency: string;
  results: { store: string; price: number; url: string | null }[];
  recommended: { store: string; price: number; reason: string | null } | null;
};

const PROMPT = (query: string) => `Cari harga produk ini di toko-toko Jepang (situs resmi dan toko online yang muncul paling atas): "${query}".
Lakukan pencarian web. Setelah itu, balas dengan SATU objek JSON valid yang DIBUNGKUS penanda, persis seperti ini (tanpa teks lain di antara penanda):
[[JSON]]
{"product":"nama produk","currency":"JPY","results":[{"store":"nama toko","price":12345,"url":"https://..."}],"recommended":{"store":"nama toko","price":12345,"reason":"alasan singkat"}}
[[/JSON]]
Aturan:
- results maksimal 3, urut dari harga termurah.
- price adalah angka dalam JPY (tanpa simbol/koma/titik ribuan; jika tidak ada harga, isi 0).
- url adalah link ke halaman produk/toko (boleh string kosong).
- recommended adalah harga paling masuk akal (utamakan situs resmi/toko terpercaya; jangan pilih harga termurah kalau mencurigakan).
- currency selalu "JPY".
- Gunakan hasil pencarian web, jangan mengarang.`;

export async function searchProductPrice(query: string): Promise<SearchResult> {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY belum diatur");
  const base = process.env.AI_BASE_URL ?? "https://a.izcy.tech/v1";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "GLM-4.7",
      temperature: 0.1,
      web_search: { enable: true },
      messages: [{ role: "user", content: PROMPT(query) }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gagal mencari harga (${res.status}). ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI tidak mengembalikan hasil");

  const parsed = SearchSchema.parse(extractJson(content, "results"));
  if (parsed.results.length === 0) throw new Error("Tidak ada hasil pencarian");

  const rec = parsed.recommended;
  return {
    product: parsed.product ?? query,
    currency: (parsed.currency ?? "JPY").toUpperCase(),
    results: parsed.results.map((r) => ({ store: r.store, price: r.price, url: r.url ?? null })),
    recommended: rec
      ? { store: rec.store, price: rec.price, reason: rec.reason ?? null }
      : parsed.results[0]
        ? { store: parsed.results[0].store, price: parsed.results[0].price, reason: null }
        : null,
  };
}
