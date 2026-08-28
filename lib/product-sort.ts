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

function compareCardNumber(a: string, b: string) {
  return a.localeCompare(b, "ja", {
    numeric: true,
    sensitivity: "base",
  });
}

function digimonVariationRank(sourceType: string, variationCode: string) {
  if (sourceType !== "digimon") return 2;
  const code = variationCode.toUpperCase();
  if (/^P2D?$/.test(code)) return 0;
  if (/^P1D?$/.test(code)) return 1;
  return 2;
}

export function compareProductsForExport(
  a: {
    sourceType: string;
    variationCode: string;
    rarity: string | null;
    cardNumber: string;
  },
  b: {
    sourceType: string;
    variationCode: string;
    rarity: string | null;
    cardNumber: string;
  },
) {
  const variationOrder =
    digimonVariationRank(a.sourceType, a.variationCode) -
    digimonVariationRank(b.sourceType, b.variationCode);
  if (variationOrder) return variationOrder;

  const variationRank = digimonVariationRank(a.sourceType, a.variationCode);
  if (variationRank < 2) return compareCardNumber(a.cardNumber, b.cardNumber);
  return compareByRarityAndCardNumber(a, b);
}
