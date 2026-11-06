import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

let pool: Pool | undefined;

export function retrospectiveDatabase() {
  const connectionString = process.env.CANDIDATOS_DATABASE_URL;
  if (!connectionString) throw new Error("Banco da retrospectiva indisponível.");
  if (!pool) {
    pool = new Pool({ connectionString, max: 4, connectionTimeoutMillis: 5000 });
    attachDatabasePool(pool);
  }
  return pool;
}
