CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'digimon',
  source_url text NOT NULL,
  set_name text NOT NULL,
  set_code text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','fetching','needs_review','ready','exported','failed')),
  card_count integer NOT NULL DEFAULT 0,
  error_message text,
  fetched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_batch_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  source_key text NOT NULL,
  card_number text NOT NULL,
  variation_code text NOT NULL DEFAULT 'N',
  rarity text,
  card_type text,
  level text,
  is_parallel boolean NOT NULL DEFAULT false,
  card_name text NOT NULL,
  colors text[] NOT NULL DEFAULT '{}',
  play_cost integer,
  dp integer,
  form text,
  attribute text,
  traits text,
  upper_text text,
  lower_text text,
  source_image_url text,
  image_object_key text,
  raw_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(import_batch_id, source_key)
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  product_code text NOT NULL UNIQUE,
  product_name text NOT NULL,
  sale_price integer,
  cost_price integer,
  initial_stock integer NOT NULL DEFAULT 0,
  department_id text,
  category text,
  subcategory text,
  group_name text,
  image_file_name text,
  description_html text,
  export_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cards_batch_idx ON cards(import_batch_id);
CREATE INDEX IF NOT EXISTS products_card_idx ON products(card_id);
