ALTER TABLE catalog_sources DROP CONSTRAINT IF EXISTS catalog_sources_scraper_key_check;
ALTER TABLE catalog_sources ADD CONSTRAINT catalog_sources_scraper_key_check CHECK(scraper_key IN ('digimon','onepiece'));

DROP INDEX IF EXISTS import_batches_unique_active_set;
CREATE UNIQUE INDEX import_batches_unique_active_set
ON import_batches(source_type,lower(trim(set_code)))
WHERE source_type IN ('digimon','onepiece') AND status <> 'failed' AND set_code IS NOT NULL;

UPDATE catalog_sources SET
  source_name='ONE PIECEカードゲーム公式',
  acquisition_method='scraping',
  scraper_key='onepiece',
  default_url='https://www.onepiece-cardgame.com/cardlist/?series=550117',
  active=true,
  updated_at=now()
WHERE title_key='onepiece' AND acquisition_method='manual';
