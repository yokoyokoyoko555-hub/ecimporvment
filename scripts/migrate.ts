import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pool } from "../lib/db";

if (!pool) throw new Error("DATABASE_URLを設定してください");

const directory = path.join(process.cwd(), "db", "migrations");
for (const file of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
  await pool.query(await readFile(path.join(directory, file), "utf8"));
  console.log(`applied ${file}`);
}
await pool.end();
