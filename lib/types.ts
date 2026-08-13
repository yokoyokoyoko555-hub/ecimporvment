export type BatchStatus = "draft" | "fetching" | "needs_review" | "ready" | "exported" | "failed";

export interface ImportBatch {
  id: string;
  source_url: string;
  set_name: string;
  set_code: string | null;
  status: BatchStatus;
  card_count: number;
  created_at: string;
}
