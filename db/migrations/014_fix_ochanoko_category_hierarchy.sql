-- おちゃのこ: カテゴリ=タイトル、サブカテゴリ=収録名。
-- タイトルを特定できるスクレイピング取込を既存分も補正する。
UPDATE products p
SET category = CASE b.source_type
      WHEN 'onepiece' THEN 'ワンピースカード'
      WHEN 'digimon' THEN 'デジモンカードゲーム'
      WHEN 'lorcana' THEN 'ディズニー・ロルカナ'
      WHEN 'xross-stars' THEN 'Xross Stars'
    END,
    subcategory = regexp_replace(trim(b.set_name), '\s+【', '【', 'g'),
    updated_at = now()
FROM cards c
JOIN import_batches b ON b.id = c.import_batch_id
WHERE p.card_id = c.id
  AND b.source_type IN ('onepiece','digimon','lorcana','xross-stars');
