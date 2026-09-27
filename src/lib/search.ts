import { z } from "zod";
import { extractJson } from "./parse-json";

const priceNum = z.preprocess((v) => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.]/g, "");
    return cleaned === "" ? 0 : Number(cleaned);
  }
  return 0;
}, z.number().nonnegative());

const SearchSchema = z.object({
  product: z.string().optional(),
  currency: z.string().optional(),
  results: z
    .array(
      z.object({
        store: z.string(),
        price: priceNum,
        url: z.string().nullish(),
        priceNote: z.string().nullish(),
      }),
    )
    .default([]),
  recommended: z
    .object({
      store: z.string(),
      price: priceNum,
      reason: z.string().nullish(),
      priceNote: z.string().nullish(),
    })
    .nullish(),
});

export type SearchResult = {
  product: string;
  currency: string;
  results: { store: string; price: number; url: string | null; priceNote: string | null }[];
  recommended: { store: string; price: number; reason: string | null; priceNote: string | null } | null;
};

const PROMPT = (query: string) => `Cari harga produk ini di toko-toko Jepang (situs resmi dan toko online yang muncul paling atas): "${query}".
Lakukan pencarian web. Setelah itu, balas dengan SATU objek JSON valid yang DIBUNGKUS penanda, persis seperti ini (tanpa teks lain di antara penanda):
[[JSON]]
{"product":"nama produk","currency":"JPY","results":[{"store":"nama toko","price":12345,"url":"https://...","priceNote":"termasuk pajak"}],"recommended":{"store":"nama toko","price":12345,"reason":"alasan singkat","priceNote":"termasuk pajak"}}
[[/JSON]]
Aturan:
- results maksimal 3, urut dari harga termurah.
- price adalah estimasi harga pasar dalam JPY, angka saja (tanpa simbol/koma/titik ribuan). Untuk barang bekas/second-hand, gunakan harga pasar wajar.
- JANGAN PERNAH menulis price 0 — selalu berikan angka estimasi yang masuk akal.
- url HARUS link langsung (https://...) ke halaman produk di SITUS RESMI toko (contoh: kickslab.jp, atmos-tokyo.com, asics.com/jp, zozo.jp, adidas.jp, nike.com/jp, dll). Hanya gunakan link alternatif/marketplace (Yahoo! Shopping, Rakuten, dsb) jika situs resminya tidak ada.
- priceNote isi "termasuk pajak (税込)" atau "tanpa pajak (税抜)" jika diketahui dari sumber; kalau tidak jelas, isi string kosong.
- recommended adalah harga paling masuk akal, UTAMAKAN situs resmi toko (jangan pilih marketplace kalau ada toko resmi).
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
  const results = parsed.results.filter((r) => r.price > 0);
  if (results.length === 0) {
    throw new Error("Harga tidak bisa ditentukan. Coba tulis nama barang lebih spesifik (merk + tipe).");
  }

  const rec = parsed.recommended;
  const recommended =
    rec && rec.price > 0
      ? { store: rec.store, price: rec.price, reason: rec.reason ?? null, priceNote: rec.priceNote ?? null }
      : { store: results[0].store, price: results[0].price, reason: null, priceNote: results[0].priceNote ?? null };
  return {
    product: parsed.product ?? query,
    currency: (parsed.currency ?? "JPY").toUpperCase(),
    results: results.map((r) => ({ store: r.store, price: r.price, url: r.url ?? null, priceNote: r.priceNote ?? null })),
    recommended,
  };
}
