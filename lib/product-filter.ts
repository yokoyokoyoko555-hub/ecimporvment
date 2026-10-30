export type ProductDisplayFilter = "all" | "damaged" | string;

export function matchesProductDisplayFilter(
  product: { rarity: string | null; isDamaged: boolean },
  filter: ProductDisplayFilter,
) {
  if (filter === "all") return true;
  if (filter === "damaged") return product.isDamaged;
  return (product.rarity || "") === filter;
}
