import type { DigimonCard } from "@/lib/digimon";

const BASE_URL =
  "https://www.takaratomy.co.jp/products/haikyuvobacabreak/cardlist";
const USER_AGENT = "CardFlow/0.1 (+product registration; low-frequency fetch)";

export type HaikyuApiCard = {
  ID: string;
  card_no: string;
  image_end: string;
  name: string;
  vobarity: string;
  category: string;
  affiliation?: string | null;
  position?: string | null;
  position_ruby?: string | null;
  skill?: string | null;
  annotation?: string | null;
  serve?: string | null;
  block?: string | null;
  receive?: string | null;
  toss?: string | null;
  attack?: string | null;
};

type HaikyuApiResponse = {
  items?: HaikyuApiCard[];
  count?: number | string;
};

export function parseHaikyuCard(card: HaikyuApiCard): DigimonCard {
  const variationCode = card.image_end.trim().toUpperCase();
  const stats = [
    ["サーブ", card.serve],
    ["ブロック", card.block],
    ["レシーブ", card.receive],
    ["トス", card.toss],
    ["アタック", card.attack],
  ]
    .filter(([, value]) => value != null && value !== "")
    .map(([label, value]) => `${label}:${value}`)
    .join(" / ");
  return {
    sourceKey: card.ID,
    cardNumber: card.card_no,
    variationCode,
    rarity: card.vobarity.trim() || null,
    cardType: card.category.trim() || null,
    level: null,
    isParallel: /[PA]$/.test(variationCode),
    cardName: card.name.trim(),
    colors: [],
    playCost: null,
    dp: null,
    form: card.position?.trim() || null,
    attribute: null,
    traits: card.affiliation?.trim() || null,
    upperText: stats || null,
    lowerText:
      [card.skill, card.annotation]
        .map((value) => value?.trim())
        .filter((value) => value && value !== "-")
        .join("\n") || null,
    imageUrl: `${BASE_URL}/card/${encodeURIComponent(card.card_no)}-${encodeURIComponent(variationCode)}.webp`,
  };
}

export async function fetchHaikyuCards(setCode: string) {
  const cards: HaikyuApiCard[] = [];
  let total = 0;
  for (let page = 1; page <= 100; page += 1) {
    const params = new URLSearchParams({
      ser: setCode.trim().toUpperCase(),
      para: "normal,p,a",
      p: String(page),
    });
    const response = await fetch(`${BASE_URL}/itemsearch.php?${params}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(
        `ハイキュー!!バボカ!!BREAK公式APIの取得に失敗しました（HTTP ${response.status}）`,
      );
    const result = (await response.json()) as HaikyuApiResponse;
    const items = result.items || [];
    total = Number(result.count || 0);
    cards.push(...items);
    if (!items.length || cards.length >= total) break;
  }
  if (!cards.length)
    throw new Error("指定したセットコードのカードが見つかりませんでした");
  if (cards.length !== total)
    throw new Error(`カード取得が途中で終了しました（${cards.length}/${total}件）`);
  return cards.map(parseHaikyuCard);
}
