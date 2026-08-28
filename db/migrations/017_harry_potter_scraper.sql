ALTER TABLE catalog_sources DROP CONSTRAINT IF EXISTS catalog_sources_scraper_key_check;
ALTER TABLE catalog_sources ADD CONSTRAINT catalog_sources_scraper_key_check
CHECK(scraper_key IN ('digimon','onepiece','lorcana','xross-stars','harrypotter'));

DROP INDEX IF EXISTS import_batches_unique_active_set;
CREATE UNIQUE INDEX import_batches_unique_active_set
ON import_batches(source_type,lower(trim(set_code)))
WHERE source_type IN ('digimon','onepiece','lorcana','xross-stars','harrypotter')
  AND status <> 'failed' AND set_code IS NOT NULL;

UPDATE catalog_sources SET
  source_name='ハリー・ポッター カードゲーム公式',
  acquisition_method='scraping',
  scraper_key='harrypotter',
  default_url='https://tcg.movic.jp/harrypotter/cardlist/',
  active=true,
  updated_at=now()
WHERE title_key='harrypotter';
