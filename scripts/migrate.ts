import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pool } from "../lib/db";

async function main() {
  if (!pool) throw new Error("DATABASE_URLを設定してください");

  const directory = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
  for (const file of files) {
    await pool.query(await readFile(path.join(directory, file), "utf8"));
    console.log(`applied ${file}`);
  }
  await pool.end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
