import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  baseCurrency: text("base_currency").notNull(),
  rateUsed: numeric("rate_used", { precision: 18, scale: 6 }).notNull(),
  rateSource: text("rate_source").notNull().default("manual"),
  rateUpdatedAt: timestamp("rate_updated_at", { withTimezone: true }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "cascade" }),
  imageRef: text("image_ref"),
  extracted: jsonb("extracted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").references(() => trips.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  itemName: text("item_name").notNull(),
  category: text("category").notNull().default("Lainnya"),
  qty: integer("qty").notNull().default(1),
  foreignCurrency: text("foreign_currency").notNull(),
  unitCostForeign: numeric("unit_cost_foreign", { precision: 14, scale: 2 }).notNull(),
  rateUsed: numeric("rate_used", { precision: 18, scale: 6 }).notNull(),
  costIdr: integer("cost_idr").notNull(),
  sellPriceIdr: integer("sell_price_idr").notNull(),
  paid: boolean("paid").notNull().default(false),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  receiptId: integer("receipt_id").references(() => receipts.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  source: text("source").notNull().default("manual"),
  status: text("status").notNull().default("accepted"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Trip = typeof trips.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
