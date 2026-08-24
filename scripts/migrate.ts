import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pool } from "../lib/db";

async function main() {
  if (!pool) throw new Error("DATABASE_URLを設定してください");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const directory = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    const applied = await pool.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE filename=$1) AS exists",
      [file],
    );
    if (applied.rows[0]?.exists) {
      console.log(`skipped ${file}`);
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(await readFile(path.join(directory, file), "utf8"));
      await client.query(
        "INSERT INTO schema_migrations(filename) VALUES($1)",
        [file],
      );
      await client.query("COMMIT");
      console.log(`applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
