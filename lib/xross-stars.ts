import type { DigimonCard } from "@/lib/digimon";

const API_URL = "https://api.xross-stars.com/v1/cards";
const USER_AGENT = "CardFlow/0.1 (+product registration; low-frequency fetch)";

export type XrossStarsApiCard = {
  id: number;
  card_product: { code: string; name: string };
  card_number: string;
  display_card_number: string;
  is_parallel: boolean;
  name: string;
  card_rarity: { display_name: string };
  card_type: { display_name: string };
  card_color: { name: string };
  cost?: number | null;
  atk?: number | null;
  hp?: number | null;
  effect?: string | null;
  image_url: string;
};

type XrossStarsResponse = {
  cards?: XrossStarsApiCard[];
  page_info?: { total_count?: number };
};

export function parseXrossStarsCard(card: XrossStarsApiCard): DigimonCard {
  const cardNumber = `${card.card_product.code}-${card.card_number}`;
  return {
    sourceKey: String(card.id),
    cardNumber,
    variationCode: "N",
    rarity: card.card_rarity.display_name,
    cardType: card.card_type.display_name,
    level: null,
    isParallel: card.is_parallel,
    cardName: card.name,
    colors: card.card_color.name ? [card.card_color.name] : [],
    playCost: card.cost ?? null,
    dp: card.atk ?? null,
    form: null,
    attribute: null,
    traits: null,
    upperText: card.hp == null ? null : `HP: ${card.hp}`,
    lowerText: card.effect?.trim() || null,
    imageUrl: card.image_url,
  };
}

export async function fetchXrossStarsCards(setCode: string) {
  const params = new URLSearchParams({
    product: setCode.trim().toUpperCase(),
    limit: "1000",
  });
  const response = await fetch(`${API_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok)
    throw new Error(
      `Xross Stars公式APIの取得に失敗しました（HTTP ${response.status}）`,
    );
  const result = (await response.json()) as XrossStarsResponse;
  const cards = result.cards || [];
  const total = result.page_info?.total_count ?? cards.length;
  if (!cards.length)
    throw new Error("指定したセットコードのカードが見つかりませんでした");
  if (cards.length !== total)
    throw new Error(`カード取得が途中で終了しました（${cards.length}/${total}件）`);
  return cards.map(parseXrossStarsCard);
}
