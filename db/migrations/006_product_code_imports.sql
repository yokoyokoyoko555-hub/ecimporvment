CREATE TABLE IF NOT EXISTS product_code_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_key text NOT NULL REFERENCES product_code_rules(title_key) ON DELETE CASCADE,
  file_names text[] NOT NULL DEFAULT '{}',
  imported_rows integer NOT NULL,
  unique_codes integer NOT NULL,
  new_codes integer NOT NULL,
  sequence_count integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_code_imports_title_created_idx
ON product_code_imports(title_key, created_at DESC);
