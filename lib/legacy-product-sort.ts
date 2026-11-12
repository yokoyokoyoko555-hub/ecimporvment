import { legacyProductRarity } from "./legacy-damaged-product";

export type LegacyProductSortItem = {
  product_number: string | null;
  product_code: string | null;
  product_name: string;
};

const naturalCompare = (left: string, right: string) =>
  left.localeCompare(right, "ja", { numeric: true, sensitivity: "base" });

const damageSeries = [
  { prefix: "OP", max: 17 },
  { prefix: "EB", max: 5 },
  { prefix: "PRB", max: 2 },
  { prefix: "ST", max: 34 },
] as const;

function damageCodeKey(productCode: string | null) {
  const code = (productCode || "").replace(/dmg$/i, "").toUpperCase();
  const match = code.match(/^(OP|EB|PRB|ST)(\d{2})-?(\d{3})-(\d{2})$/);
  if (!match) return { series: damageSeries.length, set: 0, card: 0, branch: 0, code };
  const set = Number(match[2]);
  const series = damageSeries.findIndex(
    (item) => item.prefix === match[1] && set >= 1 && set <= item.max,
  );
  return {
    series: series < 0 ? damageSeries.length : series,
    set,
    card: Number(match[3]),
    branch: Number(match[4]),
    code,
  };
}

export function compareLegacyProductsForExport(
  left: LegacyProductSortItem,
  right: LegacyProductSortItem,
) {
  const leftNumber = left.product_number?.trim() || "";
  const rightNumber = right.product_number?.trim() || "";
  if (leftNumber && rightNumber) {
    const leftNumeric = /^\d+$/.test(leftNumber);
    const rightNumeric = /^\d+$/.test(rightNumber);
    if (leftNumeric && rightNumeric)
      return Number(leftNumber) - Number(rightNumber);
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return naturalCompare(leftNumber, rightNumber);
  }
  if (leftNumber || rightNumber) return leftNumber ? -1 : 1;

  const leftCode = (left.product_code || "").replace(/dmg$/i, "");
  const rightCode = (right.product_code || "").replace(/dmg$/i, "");
  const leftKey = damageCodeKey(left.product_code);
  const rightKey = damageCodeKey(right.product_code);
  if (leftKey.series !== rightKey.series)
    return leftKey.series - rightKey.series;

  const rarityOrder = ["SEC", "SR", "R"];
  const leftRarity = rarityOrder.indexOf(legacyProductRarity(left.product_name) || "");
  const rightRarity = rarityOrder.indexOf(legacyProductRarity(right.product_name) || "");
  const leftRank = leftRarity < 0 ? rarityOrder.length : leftRarity;
  const rightRank = rightRarity < 0 ? rarityOrder.length : rightRarity;
  if (leftRank !== rightRank) return leftRank - rightRank;

  return (
    leftKey.set - rightKey.set ||
    leftKey.card - rightKey.card ||
    leftKey.branch - rightKey.branch ||
    naturalCompare(leftCode, rightCode) ||
    naturalCompare(left.product_name, right.product_name)
  );
}
