-- 同一タイトル・セットコードの重複取込は、最初の正常な取込だけを残す。
WITH ranked_batches AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY source_type, lower(trim(set_code))
           ORDER BY created_at ASC, id ASC
         ) AS duplicate_number
  FROM import_batches
  WHERE status <> 'failed' AND set_code IS NOT NULL
)
DELETE FROM import_batches
WHERE id IN (
  SELECT id FROM ranked_batches WHERE duplicate_number > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS import_batches_unique_active_set
ON import_batches (source_type, lower(trim(set_code)))
WHERE status <> 'failed' AND set_code IS NOT NULL;
