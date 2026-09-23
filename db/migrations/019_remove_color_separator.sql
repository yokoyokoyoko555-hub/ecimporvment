-- 複数色の括弧内だけ中黒を除去する。カード名に含まれる中黒は保持する。
DO $$
DECLARE
  changed integer;
BEGIN
  LOOP
    UPDATE products
    SET product_name = regexp_replace(
      product_name,
      '【([赤青黄緑紫黒白]*)・([赤青黄緑紫黒白・]*)】',
      '【\1\2】',
      'g'
    ),
    updated_at = now()
    WHERE product_name ~ '【[赤青黄緑紫黒白]*・[赤青黄緑紫黒白・]*】';

    GET DIAGNOSTICS changed = ROW_COUNT;
    EXIT WHEN changed = 0;
  END LOOP;
END $$;
