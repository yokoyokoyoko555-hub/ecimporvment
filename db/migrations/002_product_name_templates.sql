CREATE TABLE IF NOT EXISTS product_name_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  template_text text NOT NULL,
  multiple_colors_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO product_name_templates(title_key, display_name, template_text, multiple_colors_label)
VALUES
  ('onepiece', 'ワンピースカード', '{{name}} 【{{rarity}}】【{{color}}】【{{card_number}}】', NULL),
  ('digimon', 'デジモンカード', '{{name}}【{{rarity}}】【{{card_number}}】【{{color}}】', '多')
ON CONFLICT(title_key) DO NOTHING;
