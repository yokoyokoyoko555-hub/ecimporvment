const ONE_PIECE_DEFAULT_PRICES: Record<string, number> = {
  R: 80,
  UC: 50,
  C: 30,
};

export function onePieceDefaultSalePrice(rarity: string | null | undefined) {
  return ONE_PIECE_DEFAULT_PRICES[(rarity || "").trim()] ?? null;
}
