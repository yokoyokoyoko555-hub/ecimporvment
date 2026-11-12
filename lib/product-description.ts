export const PRODUCT_DESCRIPTION_FIELDS = [
  "product_name",
  "card_name",
  "rarity",
  "color",
  "card_number",
  "set_name",
  "set_code",
  "traits",
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
  traits: string | null;
};

export const DEFAULT_PRODUCT_DESCRIPTION_TEMPLATE =
  `<div class='product-info'>
  <div class='product-heading bold'>商品詳細</div>
  <div class='product-heading-line'></div>
  <div class='product-detail'>
  コチラの商品は店頭との併売商品となっております。<br />
  入金確認後に商品をご確保する関係上、ご用意できない可能性がございます。<br />
  その場合の代金は全額ご返金させていただきます。<br />
  ご了承ください。<br /><br />
  {{set_name}}<br />
  {{product_name}}<br />
  特徴:{{traits}}
  </div>
  <div class='product-heading bold'>状態に関して</div>
  <div class='product-heading-line'></div>
  <div class='product-detail'>
  この商品の状態は<span class='product-attention-text font-red'>A</span>になります。<br />
  状態表記に関しては<a href='https://torecabinks.ocnk.net/page/1' class='product-attention-text' target='_blank'>コチラ</a>をご確認ください。
  </div>
  <div class='product-heading bold'>発送方法・送料に関して</div>
  <div class='product-heading-line'></div>
  <div class='product-detail'>
  ゆうパケットで発送の場合は<span class='product-attention-text font-red'>一律250円</span>になります。<br />
  <span class='product-attention-text font-red'>10,000円以上購入で送料無料</span><br />
  発送方法・送料に関しては<a href='https://torecabinks.ocnk.net/help#help_charge' class='product-attention-text' target='_blank'>コチラ</a>をご確認ください。<br />
  入金確認から<span class='product-attention-text font-red'>24時間</span>以内に発送いたします。
  </div>
</div>`;

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
    traits: values.traits || "",
  };
  const rendered = templateText.replace(/\{\{([a-z_]+)\}\}/g, (match, field) =>
    field in replacements
      ? replacements[field as ProductDescriptionField]
      : match,
  );
  return applyProductConditionToDescription(rendered, values.productName);
}

export function applyProductConditionToDescription(
  description: string,
  productName: string,
) {
  if (!productName.startsWith("【傷あり特価】")) return description;
  return description.replace(
    /(この商品の状態は\s*<span\b[^>]*>)A(<\/span>)/,
    "$1A-$2",
  );
}
