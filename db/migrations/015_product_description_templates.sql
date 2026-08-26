CREATE TABLE IF NOT EXISTS product_description_templates (
  title_key text PRIMARY KEY REFERENCES product_name_templates(title_key) ON DELETE CASCADE,
  template_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO product_description_templates(title_key,template_text)
SELECT title_key, '{{product_name}}<br />収録：{{set_name}}<br />型番：{{card_number}}'
FROM product_name_templates
ON CONFLICT(title_key) DO NOTHING;

-- スクレイピング商品の販売価格と在庫は未入力ではなく0を初期値にする。
UPDATE products p
SET sale_price = COALESCE(p.sale_price, 0),
    initial_stock = COALESCE(p.initial_stock, 0),
    updated_at = now()
FROM cards c
JOIN import_batches b ON b.id = c.import_batch_id
WHERE p.card_id = c.id
  AND b.source_type IN ('onepiece','digimon','lorcana','xross-stars')
  AND (p.sale_price IS NULL OR p.initial_stock IS NULL);
