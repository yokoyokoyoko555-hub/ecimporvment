UPDATE legacy_ochanoko_products
SET publication_status = '準備中',
    raw_data = jsonb_set(
      COALESCE(raw_data, '{}'::jsonb),
      '{公開状態}',
      to_jsonb('準備中'::text),
      true
    ),
    updated_at = now()
WHERE title_key = 'onepiece'
  AND product_number IS NULL
  AND is_damaged = true
  AND source_file = 'generated_damage'
  AND publication_status = '非表示';
