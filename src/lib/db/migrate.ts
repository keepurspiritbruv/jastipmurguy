import { db } from "./index";
import { sql } from "drizzle-orm";

const DDL = [
  `CREATE TABLE IF NOT EXISTS trips (
    id serial PRIMARY KEY,
    name text NOT NULL,
    country text NOT NULL,
    base_currency text NOT NULL,
    rate_used numeric(18,6) NOT NULL,
    rate_source text NOT NULL DEFAULT 'manual',
    rate_updated_at timestamptz,
    start_date date,
    end_date date,
    status text NOT NULL DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id serial PRIMARY KEY,
    name text NOT NULL,
    phone text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS receipts (
    id serial PRIMARY KEY,
    trip_id integer REFERENCES trips(id) ON DELETE CASCADE,
    image_ref text,
    extracted jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id serial PRIMARY KEY,
    trip_id integer NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    customer_id integer REFERENCES customers(id) ON DELETE SET NULL,
    item_name text NOT NULL,
    category text NOT NULL DEFAULT 'Lainnya',
    qty integer NOT NULL DEFAULT 1,
    foreign_currency text NOT NULL,
    unit_cost_foreign numeric(14,2) NOT NULL,
    rate_used numeric(18,6) NOT NULL,
    cost_idr integer NOT NULL,
    sell_price_idr integer NOT NULL,
    paid boolean NOT NULL DEFAULT false,
    paid_at timestamptz,
    receipt_id integer REFERENCES receipts(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS orders_trip_idx ON orders(trip_id)`,
  `CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id)`,
];

export async function migrate() {
  for (const statement of DDL) {
    await db.execute(sql.raw(statement));
  }
}
