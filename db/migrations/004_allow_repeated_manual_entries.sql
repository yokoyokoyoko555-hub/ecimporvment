-- 重複防止はスクレイピング取込だけに適用する。
-- 手動登録は同じセットコードへ後日カードを追加できるようにする。
DROP INDEX IF EXISTS import_batches_unique_active_set;

CREATE UNIQUE INDEX import_batches_unique_active_set
ON import_batches (source_type, lower(trim(set_code)))
WHERE source_type = 'digimon' AND status <> 'failed' AND set_code IS NOT NULL;
