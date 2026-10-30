UPDATE products p
SET group_name = CASE
  WHEN coalesce(trim(p.group_name), '') = '' THEN '★SALE★'
  WHEN NOT ('★SALE★' = ANY(regexp_split_to_array(p.group_name, E'\\r?\\n')))
    THEN p.group_name || E'\n★SALE★'
  ELSE p.group_name
END,
updated_at = now()
FROM cards c
WHERE c.id = p.card_id
  AND c.source_key LIKE '%-dmg';
