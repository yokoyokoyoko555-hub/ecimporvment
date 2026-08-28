import type { DigimonCard } from "@/lib/digimon";

const API_BASE =
  "https://tcg.movic.jp/harrypotter/card-management/api/public/cards";
const USER_AGENT = "CardFlow/0.1 (+product registration; low-frequency fetch)";

type MasterValue = { id: number; value: string };

type HarryPotterMasters = {
  cardTypes: MasterValue[];
  rarities: MasterValue[];
  products: MasterValue[];
};

type SearchCard = {
  cardNumber: string;
  cardName: string;
  cardTitle?: string;
  cardTypeId: number;
  cost: number | null;
  imageUrl: string;
};

type SearchResponse = {
  total: number;
  overflow: boolean;
  cards: SearchCard[];
};

export type HarryPotterDetail = {
  id: number;
  cardNumber: string;
  cardName: string;
  cardType: MasterValue | null;
  rarity: MasterValue | null;
  cost: number | null;
  mp: number | null;
  ap: number | null;
  dp: number | null;
  text: string | null;
  parallel: boolean;
  tags: MasterValue[];
  products: MasterValue[];
  imageUrl: string;
};

function normalized(value: string) {
  return value.normalize("NFKC").replace(/[\s【】\[\]]/g, "").toLowerCase();
}

export function findHarryPotterProduct(
  products: MasterValue[],
  setName: string,
  setCode: string,
) {
  const wanted = normalized(setName);
  const direct = products.find((product) => {
    const candidate = normalized(product.value);
    return candidate === wanted || wanted.includes(candidate);
  });
  if (direct) return direct;

  const number = setCode.match(/(\d+)$/)?.[1]?.replace(/^0+/, "") || "";
  if (number) {
    const byPart = products.filter((product) =>
      normalized(product.value).includes(`part.${number}`),
    );
    if (byPart.length === 1) return byPart[0];
  }
  return null;
}

export function parseHarryPotterCard(card: HarryPotterDetail): DigimonCard {
  const holo = /\(holo\)/i.test(card.cardNumber);
  const suffix = card.cardNumber.match(/([a-z])$/i)?.[1]?.toUpperCase();
  const variationCode = holo ? "HOLO" : suffix || (card.parallel ? "P" : "N");
  const stats = [
    card.ap == null ? null : `AP: ${card.ap}`,
    card.mp == null ? null : `MP: ${card.mp}`,
  ].filter(Boolean);
  return {
    sourceKey: String(card.id),
    cardNumber: card.cardNumber,
    variationCode,
    rarity: card.rarity?.value || null,
    cardType: card.cardType?.value || null,
    level: null,
    isParallel: card.parallel,
    cardName: card.cardName,
    colors: [],
    playCost: card.cost,
    dp: card.dp,
    form: null,
    attribute: null,
    traits: card.tags.map((tag) => tag.value).join("/") || null,
    upperText: stats.join(" / ") || null,
    lowerText: card.text?.trim() || null,
    imageUrl: card.imageUrl,
  };
}

async function requestJson<T>(path: string, body?: unknown): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.ok) return (await response.json()) as T;
    if (response.status !== 429 && response.status < 500)
      throw new Error(
        `ハリー・ポッター公式APIの取得に失敗しました（HTTP ${response.status}）`,
      );
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1_000
      : 1_000 * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  throw new Error("ハリー・ポッター公式APIが混雑しています。時間をおいて再実行してください");
}

export async function fetchHarryPotterCards(setName: string, setCode: string) {
  const masters = await requestJson<HarryPotterMasters>("/masters");
  const product = findHarryPotterProduct(masters.products, setName, setCode);
  if (!product)
    throw new Error(
      `収録商品が見つかりません。商品セット名を公式表記で入力してください（候補：${masters.products.map((item) => item.value).join("、")}）`,
    );

  const searches: Array<{ rarity: MasterValue; result: SearchResponse }> = [];
  for (const rarity of masters.rarities) {
    searches.push({
      rarity,
      result: await requestJson<SearchResponse>("/search", {
        productIds: [product.id],
        rarityIds: [rarity.id],
        sortBy: "cardNumber",
        sortDirection: "asc",
      }),
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  for (const search of searches) {
    if (search.result.overflow)
      throw new Error(
        `${search.rarity.value}の取得件数が公式APIの上限を超えました`,
      );
    if (search.result.cards.length !== search.result.total)
      throw new Error(
        `${search.rarity.value}のカード取得が途中で終了しました（${search.result.cards.length}/${search.result.total}件）`,
      );
  }
  const summaries = searches.flatMap((search) => search.result.cards);
  if (!summaries.length)
    throw new Error("指定した収録商品のカードが見つかりませんでした");

  const details: HarryPotterDetail[] = [];
  for (let start = 0; start < summaries.length; start += 4) {
    details.push(
      ...(await Promise.all(
        summaries.slice(start, start + 4).map((card) =>
          requestJson<HarryPotterDetail>("/detail", {
            cardNumber: card.cardNumber,
          }),
        ),
      )),
    );
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return details.map(parseHarryPotterCard);
}
