-- 既に取り込まれているデジモン商品にも新しいバリエーション表記を適用する。
UPDATE products p
SET product_name = rtrim(p.product_name) ||
  CASE
    WHEN upper(c.variation_code) ~ '^P1D?$' THEN '【パラレル】'
    WHEN upper(c.variation_code) ~ '^P2D?$' THEN '【SP・希少】'
  END,
  updated_at = now()
FROM cards c
JOIN import_batches b ON b.id=c.import_batch_id
WHERE p.card_id=c.id
  AND b.source_type='digimon'
  AND (
    (upper(c.variation_code) ~ '^P1D?$' AND rtrim(p.product_name) NOT LIKE '%【パラレル】')
    OR
    (upper(c.variation_code) ~ '^P2D?$' AND rtrim(p.product_name) NOT LIKE '%【SP・希少】')
  );
