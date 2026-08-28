export const RARITY_HIGH_TO_LOW = [
  "アイコニック",
  "エンチャンテッド",
  "エピック",
  "スーパーパラレル",
  "SEC",
  "SP",
  "UR",
  "SR★★",
  "SR★",
  "レジェンダリー",
  "リーダーパラレル",
  "パラレル",
  "L",
  "スーパーレア",
  "SR",
  "R★",
  "レア",
  "R",
  "Pt★",
  "Pt",
  "アンコモン",
  "UC",
  "U",
  "コモン",
  "C",
  "N",
  "ST",
  "P",
] as const;

export function rarityRank(rarity: string | null) {
  const rank = RARITY_HIGH_TO_LOW.indexOf(
    (rarity || "") as (typeof RARITY_HIGH_TO_LOW)[number],
  );
  return rank === -1 ? RARITY_HIGH_TO_LOW.length : rank;
}

export function compareByRarityAndCardNumber(
  a: { rarity: string | null; cardNumber: string },
  b: { rarity: string | null; cardNumber: string },
) {
  return (
    rarityRank(a.rarity) - rarityRank(b.rarity) ||
    a.cardNumber.localeCompare(b.cardNumber, "ja", {
      numeric: true,
      sensitivity: "base",
    })
  );
}
