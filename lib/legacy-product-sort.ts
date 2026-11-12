import { legacyProductRarity } from "./legacy-damaged-product";

export type LegacyProductSortItem = {
  product_number: string | null;
  product_code: string | null;
  product_name: string;
};

const naturalCompare = (left: string, right: string) =>
  left.localeCompare(right, "ja", { numeric: true, sensitivity: "base" });

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

  const rarityOrder = ["SEC", "SR", "R"];
  const leftRarity = rarityOrder.indexOf(legacyProductRarity(left.product_name) || "");
  const rightRarity = rarityOrder.indexOf(legacyProductRarity(right.product_name) || "");
  const leftRank = leftRarity < 0 ? rarityOrder.length : leftRarity;
  const rightRank = rightRarity < 0 ? rarityOrder.length : rightRarity;
  if (leftRank !== rightRank) return leftRank - rightRank;

  const leftCode = (left.product_code || "").replace(/dmg$/i, "");
  const rightCode = (right.product_code || "").replace(/dmg$/i, "");
  return naturalCompare(leftCode, rightCode) || naturalCompare(left.product_name, right.product_name);
}
