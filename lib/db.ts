import { Pool, type QueryResultRow } from "pg";

declare global {
  var __ecPool: Pool | undefined;
}

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const pool = global.__ecPool ?? (hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined })
  : undefined);

if (process.env.NODE_ENV !== "production" && pool) global.__ecPool = pool;

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  if (!pool) throw new Error("DATABASE_URLが設定されていません");
  return pool.query<T>(text, values);
}
