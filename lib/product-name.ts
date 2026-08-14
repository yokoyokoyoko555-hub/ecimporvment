export const PRODUCT_NAME_FIELDS = ["name", "rarity", "color", "card_number", "set_code", "parallel"] as const;
export type ProductNameField = typeof PRODUCT_NAME_FIELDS[number];

export interface ProductNameTemplate { templateText: string; multipleColorsLabel?: string | null }
export interface ProductNameValues { name: string; rarity?: string | null; colors?: string[]; cardNumber: string; setCode?: string | null; isParallel?: boolean }

export const DEFAULT_PRODUCT_NAME_TEMPLATES = {
  onepiece: { templateText: "{{name}} 【{{rarity}}】【{{color}}】【{{card_number}}】", multipleColorsLabel: null },
  digimon: { templateText: "{{name}}【{{rarity}}】【{{card_number}}】【{{color}}】", multipleColorsLabel: "多" },
};

export function renderProductName(template: ProductNameTemplate, values: ProductNameValues) {
  const colors = values.colors || [];
  const color = colors.length > 1 && template.multipleColorsLabel ? template.multipleColorsLabel : colors.join("・");
  const replacements: Record<ProductNameField, string> = { name: values.name, rarity: values.rarity || "", color, card_number: values.cardNumber, set_code: values.setCode || "", parallel: values.isParallel ? "パラレル" : "" };
  return template.templateText.replace(/\{\{([a-z_]+)\}\}/g, (match, key: string) => key in replacements ? replacements[key as ProductNameField] : match).trim();
}
