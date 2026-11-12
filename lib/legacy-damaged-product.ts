import { parseOchanokoGroups, serializeOchanokoGroups } from "./ochanoko-groups";

export const LEGACY_DAMAGE_GROUP = "★SALE★SEC以下";
export const LEGACY_DAMAGE_RARITIES = ["SEC", "SR", "R"] as const;

export function legacyProductRarity(productName: string) {
  return LEGACY_DAMAGE_RARITIES.find((rarity) =>
    productName.includes(`【${rarity}】`),
  ) || null;
}

export function isLegacyDamageCandidate(
  productName: string,
  groupName: string | null | undefined,
  productCode: string | null | undefined,
) {
  if (!productCode || productCode.toLowerCase().endsWith("dmg")) return false;
  if (!legacyProductRarity(productName)) return false;
  const parallelText = `${productName}\n${groupName || ""}`;
  return !parallelText.includes("パラレル") && !parseOchanokoGroups(groupName).includes("SP");
}

export function withLegacyDamageGroup(groupName: string | null | undefined) {
  return serializeOchanokoGroups([
    ...parseOchanokoGroups(groupName),
    LEGACY_DAMAGE_GROUP,
  ]);
}
