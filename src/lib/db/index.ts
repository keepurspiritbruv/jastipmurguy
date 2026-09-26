import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

export type DB = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

function create(): DB {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzle(postgres(url, { prepare: false, connect_timeout: 15 }), { schema }) as DB;
  }
  const client = new PGlite("./.pglite");
  return drizzlePglite(client, { schema }) as DB;
}

const globalForDb = globalThis as unknown as { __jastipDb?: DB };

export const db: DB = globalForDb.__jastipDb ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__jastipDb = db;

export { schema };
