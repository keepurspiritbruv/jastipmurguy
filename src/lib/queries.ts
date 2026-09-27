import { and, desc, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db } from "./db";
import { customers, orders, receipts, trips } from "./db/schema";
import type * as schema from "./db/schema";
import type { ReceiptDraft } from "./ocr";

const d = db as unknown as PostgresJsDatabase<typeof schema>;

export type OrderView = {
  id: number;
  tripId: number | null;
  customerId: number | null;
  customerName: string | null;
  itemName: string;
  category: string;
  qty: number;
  foreignCurrency: string;
  unitCostForeign: number;
  rateUsed: number;
  costIdr: number;
  sellPriceIdr: number;
  paid: boolean;
  paidAt: Date | null;
  notes: string | null;
  source: string;
  createdAt: Date;
};

type OrderRow = {
  order: typeof orders.$inferSelect;
  customerName: string | null;
};

function toView({ order, customerName }: OrderRow): OrderView {
  return {
    id: order.id,
    tripId: order.tripId,
    customerId: order.customerId,
    customerName,
    itemName: order.itemName,
    category: order.category,
    qty: order.qty,
    foreignCurrency: order.foreignCurrency,
    unitCostForeign: Number(order.unitCostForeign),
    rateUsed: Number(order.rateUsed),
    costIdr: order.costIdr,
    sellPriceIdr: order.sellPriceIdr,
    paid: order.paid,
    paidAt: order.paidAt,
    notes: order.notes,
    source: order.source,
    createdAt: order.createdAt,
  };
}

export async function listTrips() {
  return d.select().from(trips).orderBy(desc(trips.createdAt));
}

export async function getTrip(id: number) {
  const rows = await d.select().from(trips).where(eq(trips.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getDefaultTrip() {
  const active = await d
    .select()
    .from(trips)
    .where(eq(trips.status, "active"))
    .orderBy(desc(trips.createdAt))
    .limit(1);
  if (active[0]) return active[0];
  const any = await d.select().from(trips).orderBy(desc(trips.createdAt)).limit(1);
  return any[0] ?? null;
}

export async function createTrip(input: {
  name: string;
  country: string;
  baseCurrency: string;
  rateUsed: number;
  rateSource?: string;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const rows = await d
    .insert(trips)
    .values({
      name: input.name,
      country: input.country,
      baseCurrency: input.baseCurrency,
      rateUsed: String(input.rateUsed),
      rateSource: input.rateSource ?? "manual",
      rateUpdatedAt: new Date(),
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
    })
    .returning();
  return rows[0];
}

export async function updateTrip(
  id: number,
  input: {
    name?: string;
    country?: string;
    baseCurrency?: string;
    rateUsed?: number;
    rateSource?: string;
    status?: string;
    endDate?: string | null;
  },
) {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.country !== undefined) patch.country = input.country;
  if (input.baseCurrency !== undefined) patch.baseCurrency = input.baseCurrency;
  if (input.rateUsed !== undefined) {
    patch.rateUsed = String(input.rateUsed);
    patch.rateUpdatedAt = new Date();
  }
  if (input.rateSource !== undefined) patch.rateSource = input.rateSource;
  if (input.status !== undefined) patch.status = input.status;
  if (input.endDate !== undefined) patch.endDate = input.endDate;
  if (Object.keys(patch).length === 0) return;
  await d.update(trips).set(patch).where(eq(trips.id, id));
}

export async function allOrders() {
  const rows = await d
    .select({ order: orders, customerName: customers.name })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(desc(orders.createdAt));
  return rows.map(toView);
}

export async function listOrders(tripId: number, customerId?: number, unpaidOnly?: boolean) {
  const conditions = [eq(orders.tripId, tripId)];
  if (customerId) conditions.push(eq(orders.customerId, customerId));
  if (unpaidOnly) conditions.push(eq(orders.paid, false));
  const rows = await d
    .select({ order: orders, customerName: customers.name })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));
  return rows.map(toView);
}

export async function getOrder(id: number) {
  const rows = await d.select().from(orders).where(eq(orders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listClientOrders() {
  const rows = await d
    .select({ order: orders, customerName: customers.name })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(isNull(orders.tripId))
    .orderBy(desc(orders.createdAt));
  return rows.map(toView);
}

export async function listCustomers() {
  return d.select().from(customers).orderBy(customers.name);
}

export async function findOrCreateCustomer(name: string, phone?: string | null) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = await d
    .select()
    .from(customers)
    .where(eq(customers.name, trimmed))
    .limit(1);
  if (existing[0]) {
    if (phone && !existing[0].phone) {
      await d.update(customers).set({ phone }).where(eq(customers.id, existing[0].id));
    }
    return existing[0].id;
  }
  const rows = await d
    .insert(customers)
    .values({ name: trimmed, phone: phone ?? null })
    .returning();
  return rows[0].id;
}

export async function createOrder(input: {
  tripId: number | null;
  customerId: number | null;
  itemName: string;
  category: string;
  qty: number;
  foreignCurrency: string;
  unitCostForeign: number;
  rateUsed: number;
  costIdr: number;
  sellPriceIdr: number;
  notes?: string | null;
  paid?: boolean;
  receiptId?: number | null;
  source?: string;
}) {
  const rows = await d
    .insert(orders)
    .values({
      tripId: input.tripId,
      customerId: input.customerId,
      itemName: input.itemName,
      category: input.category,
      qty: input.qty,
      foreignCurrency: input.foreignCurrency,
      unitCostForeign: String(input.unitCostForeign),
      rateUsed: String(input.rateUsed),
      costIdr: input.costIdr,
      sellPriceIdr: input.sellPriceIdr,
      notes: input.notes ?? null,
      paid: input.paid ?? false,
      paidAt: input.paid ? new Date() : null,
      receiptId: input.receiptId ?? null,
      source: input.source ?? "manual",
    })
    .returning();
  return rows[0];
}

export async function updateOrder(
  id: number,
  input: {
    customerId?: number | null;
    itemName?: string;
    category?: string;
    qty?: number;
    foreignCurrency?: string;
    unitCostForeign?: number;
    rateUsed?: number;
    costIdr?: number;
    sellPriceIdr?: number;
    notes?: string | null;
  },
) {
  const patch: Record<string, unknown> = {};
  if (input.customerId !== undefined) patch.customerId = input.customerId;
  if (input.itemName !== undefined) patch.itemName = input.itemName;
  if (input.category !== undefined) patch.category = input.category;
  if (input.qty !== undefined) patch.qty = input.qty;
  if (input.foreignCurrency !== undefined) patch.foreignCurrency = input.foreignCurrency;
  if (input.unitCostForeign !== undefined) patch.unitCostForeign = String(input.unitCostForeign);
  if (input.rateUsed !== undefined) patch.rateUsed = String(input.rateUsed);
  if (input.costIdr !== undefined) patch.costIdr = input.costIdr;
  if (input.sellPriceIdr !== undefined) patch.sellPriceIdr = input.sellPriceIdr;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (Object.keys(patch).length === 0) return;
  await d.update(orders).set(patch).where(eq(orders.id, id));
}

export async function setOrderPaid(id: number, paid: boolean) {
  await d
    .update(orders)
    .set({ paid, paidAt: paid ? new Date() : null })
    .where(eq(orders.id, id));
}

export async function deleteOrder(id: number) {
  await d.delete(orders).where(eq(orders.id, id));
}

export async function createReceipt(tripId: number | null, extracted: ReceiptDraft) {
  const rows = await d
    .insert(receipts)
    .values({ tripId, extracted })
    .returning();
  return rows[0];
}
