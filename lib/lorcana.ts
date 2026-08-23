import type { DigimonCard } from "@/lib/digimon";

const BASE_URL = "https://www.takaratomy.co.jp";
const TOKEN_URL = `${BASE_URL}/products/disneylorcana/api1.0/card-search/token.json`;
const RESULT_URL = `${BASE_URL}/products/disneylorcana/api1.0/card-search/result`;
const IMAGE_DIR = `${BASE_URL}/products/disneylorcana/cardlist/img/card/`;
const USER_AGENT = "CardFlow/0.1 (+product registration; low-frequency fetch)";

type LorcanaApiCard = {
  collector_number: number | string;
  rarity?: string | null;
  ink_color?: string | null;
  ink_color2?: string | null;
  ink_color3?: string | null;
  ink_color4?: string | null;
  ink_color5?: string | null;
  ink_color6?: string | null;
  card_name: string;
  version?: string | null;
  card_type?: string | null;
  rules_text?: string | null;
  flavor_text?: string | null;
  ink_cost?: number | null;
  strength?: number | null;
  willpower?: number | null;
  lore_value?: number | null;
  card_file: string;
  classifications?: Array<{ classification?: string | null }>;
};

type SearchResult = {
  cards?: LorcanaApiCard[];
  count?: number;
  page?: string | number;
};

const text = (value: string | null | undefined) => {
  const cleaned = value
    ?.replace(/%/g, "\n")
    .replace(/\\([^\\]+)\\/g, "$1")
    .trim();
  return cleaned && cleaned !== "-" ? cleaned : null;
};

export function parseLorcanaCard(
  card: LorcanaApiCard,
  setCode: string,
): DigimonCard {
  const collectorNumber = String(card.collector_number).padStart(3, "0");
  const cardNumber = `${setCode.trim().toUpperCase()}-${collectorNumber}`;
  const version = text(card.version);
  const colors = [
    card.ink_color,
    card.ink_color2,
    card.ink_color3,
    card.ink_color4,
    card.ink_color5,
    card.ink_color6,
  ]
    .map((color) => text(color))
    .filter((color): color is string => Boolean(color));
  const traits =
    (card.classifications || [])
      .map((item) => text(item.classification))
      .filter((item): item is string => Boolean(item))
      .join("・") || null;
  return {
    sourceKey: card.card_file,
    cardNumber,
    variationCode: "N",
    rarity: text(card.rarity),
    cardType: text(card.card_type),
    level: null,
    isParallel: false,
    cardName: version ? `${card.card_name} - ${version}` : card.card_name,
    colors,
    playCost: card.ink_cost ?? null,
    dp: card.strength ?? null,
    form: null,
    attribute: null,
    traits,
    upperText: text(card.flavor_text),
    lowerText: text(card.rules_text),
    imageUrl: `${IMAGE_DIR}${encodeURIComponent(card.card_file)}.png`,
  };
}

async function beginSession() {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok)
    throw new Error(
      `ロルカナ公式APIの認証に失敗しました（HTTP ${response.status}）`,
    );
  const result = (await response.json()) as { csrf?: string };
  const cookie = response.headers.get("set-cookie")?.split(";")[0];
  if (!result.csrf || !cookie)
    throw new Error("ロルカナ公式APIの認証情報を取得できませんでした");
  return { csrf: result.csrf, cookie };
}

function selectSets(sourceUrl: string, setName: string) {
  const url = new URL(sourceUrl);
  const requested = [
    ...url.searchParams.getAll("sets[]"),
    ...url.searchParams.getAll("sets"),
  ].filter(Boolean);
  if (requested.length) return requested;
  return [setName.replace(/【[^】]+】\s*$/, "").trim()];
}

export async function fetchLorcanaCards(
  sourceUrl: string,
  setName: string,
  setCode: string,
) {
  const session = await beginSession();
  const sets = selectSets(sourceUrl, setName);
  const cards: LorcanaApiCard[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while (cards.length < total) {
    const params = new URLSearchParams({
      posts_per_page: "100",
      page: String(page),
      search_sort: "カードナンバー（昇順）",
    });
    sets.forEach((set) => params.append("sets[]", set));
    const response = await fetch(RESULT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRF-Token": session.csrf,
        Cookie: session.cookie,
        "User-Agent": USER_AGENT,
      },
      body: params,
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok)
      throw new Error(
        `ロルカナのカード取得に失敗しました（HTTP ${response.status}）`,
      );
    const result = (await response.json()) as SearchResult;
    total = Number(result.count || 0);
    const pageCards = result.cards || [];
    cards.push(...pageCards);
    if (!pageCards.length || page > 100) break;
    page += 1;
  }
  if (!cards.length)
    throw new Error("指定したセットのカードが見つかりませんでした");
  if (cards.length < total)
    throw new Error(
      `カード取得が途中で終了しました（${cards.length}/${total}件）`,
    );
  return cards.map((card) => parseLorcanaCard(card, setCode));
}
