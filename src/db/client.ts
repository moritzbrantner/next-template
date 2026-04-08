import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@/src/db/schema";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export function getDb() {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool =
    globalForDb.pool ??
    new Pool({
      connectionString,
    });

  pool.on('error', (error) => {
    console.warn('[db] idle client error', error.message);
  });

  const db = drizzle(pool, { schema });

  globalForDb.pool = pool;
  globalForDb.db = db;

  return db;
}
