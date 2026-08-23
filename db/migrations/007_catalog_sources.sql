CREATE TABLE IF NOT EXISTS catalog_sources (
  title_key text PRIMARY KEY REFERENCES product_name_templates(title_key) ON DELETE CASCADE,
  source_name text NOT NULL,
  acquisition_method text NOT NULL DEFAULT 'manual' CHECK(acquisition_method IN ('manual','scraping')),
  scraper_key text CHECK(scraper_key IN ('digimon')),
  default_url text,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(acquisition_method = 'manual' OR scraper_key IS NOT NULL)
);

INSERT INTO catalog_sources(title_key,source_name,acquisition_method,scraper_key,default_url,active) VALUES
  ('digimon','デジモンカード公式','scraping','digimon','https://digimoncard.com/cards/?search=true&category=503039',true),
  ('onepiece','手動登録','manual',NULL,NULL,true)
ON CONFLICT(title_key) DO NOTHING;
