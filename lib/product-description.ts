export const PRODUCT_DESCRIPTION_FIELDS = [
  "product_name",
  "card_name",
  "rarity",
  "color",
  "card_number",
  "set_name",
  "set_code",
] as const;

export type ProductDescriptionField =
  (typeof PRODUCT_DESCRIPTION_FIELDS)[number];

export type ProductDescriptionValues = {
  productName: string;
  cardName: string;
  rarity: string | null;
  colors: string[];
  cardNumber: string;
  setName: string;
  setCode: string | null;
};

export const DEFAULT_PRODUCT_DESCRIPTION_TEMPLATE =
  "{{product_name}}<br />収録：{{set_name}}<br />型番：{{card_number}}";

export function renderProductDescription(
  templateText: string,
  values: ProductDescriptionValues,
) {
  const replacements: Record<ProductDescriptionField, string> = {
    product_name: values.productName,
    card_name: values.cardName,
    rarity: values.rarity || "",
    color: values.colors.join("・"),
    card_number: values.cardNumber,
    set_name: values.setName,
    set_code: values.setCode || "",
  };
  return templateText.replace(/\{\{([a-z_]+)\}\}/g, (match, field) =>
    field in replacements
      ? replacements[field as ProductDescriptionField]
      : match,
  );
}
