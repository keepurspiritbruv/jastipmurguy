"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPasscode, issueToken } from "./auth";
import { rateToIdr } from "./fx";
import { lineCostIdr } from "./money";
import { extractReceipt } from "./ocr";
import * as q from "./queries";
import { allowLogin, rateLimit } from "./ratelimit";
import { searchProductPrice } from "./search";
import { requireAuth } from "./session";

const TRIP_COOKIE = "jastip_trip";

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function intIdr(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function decimal(raw: string): number {
  const cleaned = raw.replace(/\s/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export async function login(fd: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await allowLogin(ip))) redirect("/masuk?error=2");
  const code = str(fd, "passcode");
  if (!checkPasscode(code)) {
    await new Promise((r) => setTimeout(r, 500));
    redirect("/masuk?error=1");
  }
  const store = await cookies();
  store.set(SESSION_COOKIE, issueToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/dasbor");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/masuk");
}

export async function setCurrentTrip(fd: FormData) {
  await requireAuth();
  const id = str(fd, "tripId");
  const store = await cookies();
  store.set(TRIP_COOKIE, id, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  redirect("/dasbor");
}

export async function createTripAction(fd: FormData) {
  await requireAuth();
  const schema = z.object({
    name: z.string().min(1),
    country: z.string().min(1),
    baseCurrency: z.string().min(3).max(3),
    rateUsed: z.number().positive(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  });
  const parsed = schema.safeParse({
    name: str(fd, "name"),
    country: str(fd, "country"),
    baseCurrency: str(fd, "baseCurrency").toUpperCase(),
    rateUsed: decimal(str(fd, "rateUsed")),
    startDate: str(fd, "startDate") || undefined,
    endDate: str(fd, "endDate") || undefined,
  });
  if (!parsed.success) redirect("/trip/baru?error=1");
  const trip = await q.createTrip({
    ...parsed.data,
    startDate: parsed.data.startDate ?? null,
    endDate: parsed.data.endDate ?? null,
    rateSource: "manual",
  });
  const store = await cookies();
  store.set(TRIP_COOKIE, String(trip.id), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  redirect("/dasbor");
}

export async function updateTripAction(fd: FormData) {
  await requireAuth();
  const id = Number(str(fd, "id"));
  const rate = decimal(str(fd, "rateUsed"));
  await q.updateTrip(id, {
    rateUsed: Number.isFinite(rate) && rate > 0 ? rate : undefined,
    rateSource: "manual",
    status: str(fd, "status") || undefined,
    endDate: str(fd, "endDate") || undefined,
  });
  revalidatePath("/", "layout");
  redirect("/trip");
}

export async function saveOrderAction(fd: FormData) {
  await requireAuth();
  const tripId = Number(str(fd, "tripId"));
  const orderId = Number(str(fd, "orderId")) || 0;
  const qty = Math.max(1, Math.round(decimal(str(fd, "qty")) || 1));
  const unitCostForeign = decimal(str(fd, "unitCostForeign"));
  const rateUsed = decimal(str(fd, "rateUsed"));
  const sellPriceIdr = intIdr(str(fd, "sellPriceIdr"));
  const foreignCurrency = str(fd, "foreignCurrency").toUpperCase();
  const itemName = str(fd, "itemName");

  const back = orderId ? `/pesanan/${orderId}` : `/pesanan/baru?trip=${tripId}`;
  if (!itemName || !foreignCurrency || (!orderId && !tripId)) redirect(`${back}?error=1`);
  if (!Number.isFinite(unitCostForeign) || !Number.isFinite(rateUsed) || rateUsed <= 0) {
    redirect(`${back}?error=1`);
  }

  const costIdr = lineCostIdr(unitCostForeign, qty, rateUsed);
  const customerName = str(fd, "customerName");
  const customerId = customerName
    ? await q.findOrCreateCustomer(customerName, str(fd, "customerPhone") || null)
    : null;

  const payload = {
    customerId,
    itemName,
    category: str(fd, "category") || "Lainnya",
    qty,
    foreignCurrency,
    unitCostForeign,
    rateUsed,
    costIdr,
    sellPriceIdr,
    notes: str(fd, "notes") || null,
  };

  if (orderId) await q.updateOrder(orderId, payload);
  else await q.createOrder({ tripId, ...payload });

  revalidatePath("/", "layout");
  redirect("/pesanan");
}

export async function togglePaidAction(fd: FormData) {
  await requireAuth();
  const id = Number(str(fd, "id"));
  const paid = str(fd, "paid") === "1";
  if (id) await q.setOrderPaid(id, paid);
  revalidatePath("/", "layout");
}

export async function deleteOrderAction(fd: FormData) {
  await requireAuth();
  const id = Number(str(fd, "id"));
  if (id) await q.deleteOrder(id);
  revalidatePath("/", "layout");
  redirect("/pesanan");
}

export async function markCustomerPaidAction(fd: FormData) {
  await requireAuth();
  const ids = String(fd.get("ids") ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  for (const id of ids) await q.setOrderPaid(id, true);
  revalidatePath("/", "layout");
  redirect("/pelanggan");
}

export async function addCustomerAction(fd: FormData) {
  await requireAuth();
  const name = str(fd, "name");
  if (name) await q.findOrCreateCustomer(name, str(fd, "phone") || null);
  revalidatePath("/", "layout");
  redirect("/pelanggan");
}

export async function getRateAction(currency: string) {
  await requireAuth();
  try {
    const { rate, source } = await rateToIdr(currency);
    return { ok: true as const, rate, source };
  } catch (error) {
    return { ok: false as const, error: (error as Error).message };
  }
}

export async function scanReceiptAction(imageDataUrl: string, currency: string) {
  await requireAuth();
  try {
    const draft = await extractReceipt(imageDataUrl, currency);
    return { ok: true as const, draft };
  } catch (error) {
    return { ok: false as const, error: (error as Error).message };
  }
}

export async function createOrdersFromScanAction(fd: FormData) {
  await requireAuth();
  const tripId = Number(str(fd, "tripId"));
  const raw = str(fd, "items");
  const customerName = str(fd, "customerName");
  const rateUsed = decimal(str(fd, "rateUsed"));
  const foreignCurrency = str(fd, "foreignCurrency").toUpperCase();
  if (!tripId || !raw || !Number.isFinite(rateUsed) || rateUsed <= 0) {
    redirect("/scan?error=1");
  }
  let items: { name: string; qty: number; unitPrice: number; category?: string | null }[] = [];
  try {
    items = JSON.parse(raw);
  } catch {
    redirect("/scan?error=1");
  }
  if (items.length === 0) redirect("/scan?error=1");

  const customerId = customerName
    ? await q.findOrCreateCustomer(customerName, str(fd, "customerPhone") || null)
    : null;

  for (const item of items) {
    if (!item.name || !Number.isFinite(item.unitPrice)) continue;
    await q.createOrder({
      tripId,
      customerId,
      itemName: item.name,
      category: item.category || "Lainnya",
      qty: Math.max(1, Math.round(item.qty)),
      foreignCurrency,
      unitCostForeign: item.unitPrice,
      rateUsed,
      costIdr: lineCostIdr(item.unitPrice, Math.max(1, Math.round(item.qty)), rateUsed),
      sellPriceIdr: 0,
      notes: "Dari scan struk",
    });
  }
  revalidatePath("/", "layout");
  redirect("/pesanan?scanned=1");
}

export async function searchPriceAction(query: string) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`jastip:search:${ip}`, 20, 3600))) {
    return { ok: false as const, error: "Terlalu banyak pencarian. Coba lagi nanti." };
  }
  const q = query.trim();
  if (q.length < 3) return { ok: false as const, error: "Ketik nama barang dulu." };
  try {
    const result = await searchProductPrice(q);
    const rate = Number(process.env.JASTIP_RATE ?? 115);
    const markup = Number(process.env.JASTIP_MARKUP ?? 10);
    const price = result.recommended?.price ?? result.results[0]?.price ?? 0;
    const modalIdr = lineCostIdr(price, 1, rate);
    const totalIdr = Math.round(modalIdr * (1 + markup / 100));
    const feeIdr = totalIdr - modalIdr;
    return { ok: true as const, result, rate, markup, modalIdr, totalIdr, feeIdr };
  } catch (error) {
    return { ok: false as const, error: (error as Error).message };
  }
}

export async function createClientOrderAction(fd: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`jastip:order:${ip}`, 5, 3600))) {
    redirect("/cari?error=2");
  }
  const name = str(fd, "name");
  const phone = str(fd, "phone");
  const itemName = str(fd, "itemName");
  const price = decimal(str(fd, "price"));
  const rate = decimal(str(fd, "rate"));
  const totalIdr = intIdr(str(fd, "totalIdr"));
  const currency = str(fd, "currency").toUpperCase() || "JPY";
  if (!name || !itemName || !Number.isFinite(price) || price <= 0 || !Number.isFinite(rate) || rate <= 0) {
    redirect("/cari?error=1");
  }
  const customerId = await q.findOrCreateCustomer(name, phone || null);
  await q.createOrder({
    tripId: null,
    customerId,
    itemName,
    category: "Lainnya",
    qty: 1,
    foreignCurrency: currency,
    unitCostForeign: price,
    rateUsed: rate,
    costIdr: lineCostIdr(price, 1, rate),
    sellPriceIdr: totalIdr,
    notes: str(fd, "notes") || null,
    source: "client",
  });
  revalidatePath("/", "layout");
  redirect("/cari?ok=1");
}
