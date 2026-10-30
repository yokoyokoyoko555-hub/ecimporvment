UPDATE products p
SET sale_price = CASE c.rarity
  WHEN 'R' THEN 80
  WHEN 'UC' THEN 50
  WHEN 'C' THEN 30
END,
updated_at = now()
FROM cards c
JOIN import_batches b ON b.id = c.import_batch_id
WHERE p.card_id = c.id
  AND b.source_type IN ('onepiece', 'manual:onepiece')
  AND c.rarity IN ('R', 'UC', 'C')
  AND (p.sale_price IS NULL OR p.sale_price = 0);
