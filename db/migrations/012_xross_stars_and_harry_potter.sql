ALTER TABLE catalog_sources DROP CONSTRAINT IF EXISTS catalog_sources_scraper_key_check;
ALTER TABLE catalog_sources ADD CONSTRAINT catalog_sources_scraper_key_check
CHECK(scraper_key IN ('digimon','onepiece','lorcana','xross-stars'));

DROP INDEX IF EXISTS import_batches_unique_active_set;
CREATE UNIQUE INDEX import_batches_unique_active_set
ON import_batches(source_type,lower(trim(set_code)))
WHERE source_type IN ('digimon','onepiece','lorcana','xross-stars')
  AND status <> 'failed' AND set_code IS NOT NULL;

INSERT INTO product_name_templates(title_key,display_name,template_text,multiple_colors_label) VALUES
  ('xross-stars','Xross Stars','{{name}}【{{rarity}}】【{{color}}】【{{card_number}}】',NULL),
  ('harrypotter','ハリー・ポッター カードゲーム','{{name}}【{{rarity}}】【{{card_number}}】',NULL)
ON CONFLICT(title_key) DO NOTHING;

INSERT INTO catalog_sources(title_key,source_name,acquisition_method,scraper_key,default_url,active) VALUES
  ('xross-stars','Xross Stars公式','scraping','xross-stars','https://xross-stars.com/card',true),
  ('harrypotter','公式カードリスト公開待ち','manual',NULL,NULL,true)
ON CONFLICT(title_key) DO UPDATE SET
  source_name=EXCLUDED.source_name,
  acquisition_method=EXCLUDED.acquisition_method,
  scraper_key=EXCLUDED.scraper_key,
  default_url=EXCLUDED.default_url,
  active=true,
  updated_at=now();
