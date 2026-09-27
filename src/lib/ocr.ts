import { z } from "zod";
import { CATEGORIES } from "./categories";
import { extractJson } from "./parse-json";

export const ReceiptDraftSchema = z.object({
  merchant: z.string().nullish(),
  currency: z.string().nullish(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        qty: z.number().positive().default(1),
        unitPrice: z.number().nonnegative(),
        category: z.string().nullish(),
      }),
    )
    .default([]),
});

export type ReceiptDraft = z.infer<typeof ReceiptDraftSchema>;

const PROMPT = `Kamu membaca foto struk/nota dari toko di luar negeri.
Ekstrak daftar barang yang dibeli. Balas dengan SATU objek JSON valid yang DIBUNGKUS penanda, persis seperti ini:
[[JSON]]
{"merchant":"nama toko atau kosong","currency":"kode mata uang 3 huruf mis. JPY","items":[{"name":"nama barang","qty":1,"unitPrice":120,"category":"satu dari daftar"}]}
[[/JSON]]
Aturan:
- unitPrice adalah harga satuan dalam mata uang struk (angka, tanpa simbol).
- Jika qty tidak jelas, gunakan 1.
- category pilih dari: ${CATEGORIES.join(", ")}. Jika ragu, "Lainnya".
- Jangan mengarang barang. Jika gambar bukan struk, items kosong.`;

export async function extractReceipt(imageDataUrl: string, fallbackCurrency: string): Promise<ReceiptDraft> {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY belum diatur");
  const base = process.env.AI_BASE_URL ?? "https://a.izcy.tech/v1";
  const model = process.env.AI_MODEL ?? "DeepSeek V4 Flash";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: imageDataUrl } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gagal memproses struk (${res.status}). ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI tidak mengembalikan hasil");

  const draft = ReceiptDraftSchema.parse(extractJson(content, "items"));
  if (draft.items.length === 0) throw new Error("Tidak ada barang yang terbaca dari struk");
  return {
    ...draft,
    currency: (draft.currency ?? fallbackCurrency).toUpperCase(),
  };
}
