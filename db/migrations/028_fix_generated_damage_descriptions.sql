UPDATE legacy_ochanoko_products
SET raw_data = jsonb_set(
      COALESCE(raw_data, '{}'::jsonb),
      '{説明}',
      to_jsonb(
        regexp_replace(
          COALESCE(raw_data->>'説明', ''),
          '(この商品の状態は\s*<span[^>]*>)A(</span>)',
          '\1A-\2'
        )
      ),
      true
    ),
    updated_at = now()
WHERE title_key = 'onepiece'
  AND product_number IS NULL
  AND is_damaged = true
  AND source_file = 'generated_damage'
  AND COALESCE(raw_data->>'説明', '') ~ 'この商品の状態は\s*<span[^>]*>A</span>';
