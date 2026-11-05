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
  source_type: "digimon",
  title_key: "digimon",
  title_name: "デジモンカード",
}];

export async function listBatches(limit = 20): Promise<ImportBatch[]> {
  if (!hasDatabase) return demoBatches;
  const result = await query<ImportBatch>(`SELECT b.id,b.source_url,b.set_name,b.set_code,b.status,b.card_count,b.created_at::text,b.source_type,
    CASE WHEN b.source_type LIKE 'manual:%' THEN substring(b.source_type from 8) ELSE b.source_type END title_key,
    COALESCE(t.display_name,CASE WHEN b.source_type LIKE 'manual:%' THEN substring(b.source_type from 8) ELSE b.source_type END) title_name
    FROM import_batches b
    LEFT JOIN product_name_templates t ON t.title_key=(CASE WHEN b.source_type LIKE 'manual:%' THEN substring(b.source_type from 8) ELSE b.source_type END)
    ORDER BY b.created_at DESC LIMIT $1`, [limit]);
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
