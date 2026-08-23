UPDATE products p
SET category = regexp_replace(trim(b.set_name), '\s+【', '【', 'g'),
    updated_at = now()
FROM cards c
JOIN import_batches b ON b.id = c.import_batch_id
WHERE p.card_id = c.id
  AND (p.category IS NULL OR trim(p.category) = '');
