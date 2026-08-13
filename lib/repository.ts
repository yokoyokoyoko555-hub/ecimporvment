import { hasDatabase, query } from "@/lib/db";
import type { ImportBatch } from "@/lib/types";

const demoBatches: ImportBatch[] = [{
  id: "demo-ex12",
  source_url: "https://digimoncard.com/cards/?search=true&category=503039",
  set_name: "DIGITAL WORLD SHAMBALA",
  set_code: "EX-12",
  status: "needs_review",
  card_count: 118,
  created_at: new Date().toISOString(),
}];

export async function listBatches(): Promise<ImportBatch[]> {
  if (!hasDatabase) return demoBatches;
  const result = await query<ImportBatch>(`SELECT id, source_url, set_name, set_code, status, card_count, created_at::text
    FROM import_batches ORDER BY created_at DESC LIMIT 20`);
  return result.rows;
}

export async function dashboardCounts() {
  const batches = await listBatches();
  return {
    batches: batches.length,
    cards: batches.reduce((sum, item) => sum + item.card_count, 0),
    needsReview: batches.filter((item) => item.status === "needs_review").length,
    ready: batches.filter((item) => item.status === "ready").length,
  };
}
