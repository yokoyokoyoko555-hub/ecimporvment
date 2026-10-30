UPDATE cards damaged
SET source_image_url = normal.source_image_url,
    image_object_key = normal.image_object_key
FROM cards normal
WHERE damaged.source_key LIKE '%-dmg'
  AND normal.import_batch_id = damaged.import_batch_id
  AND normal.source_key = regexp_replace(damaged.source_key, '-dmg$', '')
  AND (
    damaged.source_image_url IS DISTINCT FROM normal.source_image_url
    OR damaged.image_object_key IS DISTINCT FROM normal.image_object_key
  );

UPDATE products damaged_product
SET image_file_name = normal_product.image_file_name,
    updated_at = now()
FROM cards damaged_card
JOIN cards normal_card
  ON normal_card.import_batch_id = damaged_card.import_batch_id
 AND normal_card.source_key = regexp_replace(damaged_card.source_key, '-dmg$', '')
JOIN products normal_product ON normal_product.card_id = normal_card.id
WHERE damaged_product.card_id = damaged_card.id
  AND damaged_card.source_key LIKE '%-dmg'
  AND damaged_product.image_file_name IS DISTINCT FROM normal_product.image_file_name;
