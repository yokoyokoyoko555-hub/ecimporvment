CREATE TABLE IF NOT EXISTS legacy_ochanoko_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_key text NOT NULL DEFAULT 'onepiece',
  product_number text NOT NULL,
  product_code text,
  product_name text NOT NULL,
  category text,
  subcategory text,
  group_name text,
  sale_price integer,
  initial_stock integer,
  publication_status text,
  is_damaged boolean NOT NULL DEFAULT false,
  raw_data jsonb NOT NULL DEFAULT '{}',
  source_file text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(title_key, product_number)
);

CREATE INDEX IF NOT EXISTS legacy_ochanoko_products_title_code_idx
ON legacy_ochanoko_products(title_key, product_code);

CREATE INDEX IF NOT EXISTS legacy_ochanoko_products_title_name_idx
ON legacy_ochanoko_products(title_key, product_name);
