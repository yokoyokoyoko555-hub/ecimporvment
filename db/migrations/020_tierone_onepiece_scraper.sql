UPDATE catalog_sources
SET source_name='ONE PIECEカード（公式／ティアワンメディア）', updated_at=now()
WHERE title_key='onepiece'
  AND scraper_key='onepiece'
  AND source_name='ONE PIECEカードゲーム公式';
