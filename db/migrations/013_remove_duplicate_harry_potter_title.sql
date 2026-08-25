-- Remove the manually-created duplicate. The canonical system title added in
-- 012 uses title_key = 'harrypotter' and remains available.
DELETE FROM product_name_templates
WHERE title_key <> 'harrypotter'
  AND display_name = 'ハリーポッターカード';
