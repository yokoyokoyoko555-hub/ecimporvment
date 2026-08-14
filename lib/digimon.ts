import * as cheerio from "cheerio";

export interface DigimonCard {
  sourceKey: string;
  cardNumber: string;
  variationCode: string;
  rarity: string | null;
  cardType: string | null;
  level: string | null;
  isParallel: boolean;
  cardName: string;
  colors: string[];
  playCost: number | null;
  dp: number | null;
  form: string | null;
  attribute: string | null;
  traits: string | null;
  upperText: string | null;
  lowerText: string | null;
  imageUrl: string | null;
}

const text = (value: string | undefined) => value?.replace(/\s+/g, " ").trim() || null;
const integer = (value: string | null) => value && /^\d+$/.test(value) ? Number(value) : null;

export function parseDigimonCards(html: string, pageUrl: string): DigimonCard[] {
  const $ = cheerio.load(html);
  const cards: DigimonCard[] = [];

  $(".image_lists_item").each((_, element) => {
    const item = $(element);
    const popup = item.find(".popupCol").first();
    const sourceKey = popup.attr("id")?.trim();
    const cardNumber = text(popup.find(".cardNo").first().text());
    const cardName = text(popup.find(".cardTitle").first().text());
    if (!sourceKey || !cardNumber || !cardName) return;

    const info = new Map<string, string>();
    popup.find("dl.cardInfoBox").each((__, dl) => {
      const label = text($(dl).find("dt").first().text());
      const value = text($(dl).find("dd").first().text());
      if (label && value) info.set(label, value);
    });

    const rawImage = item.find("a.card_img img:not(.parallel_icon)").first().attr("data-src")
      || item.find("a.card_img img:not(.parallel_icon)").first().attr("src");
    const imageUrl = rawImage ? new URL(rawImage.split("?")[0], pageUrl).toString() : null;
    const isParallel = sourceKey !== cardNumber || item.find(".parallel_icon").length > 0;
    const variationCode = sourceKey === cardNumber ? "N" : sourceKey.slice(cardNumber.length).replace(/^_/, "") || "P";

    cards.push({
      sourceKey,
      cardNumber,
      variationCode,
      rarity: text(popup.find(".cardRarity").first().text()),
      cardType: text(popup.find(".cardType").first().text()),
      level: text(popup.find(".cardLv").first().text()),
      isParallel,
      cardName,
      colors: (info.get("色") || "").split(/\s+/).filter(Boolean),
      playCost: integer(info.get("コスト") || null),
      dp: integer(info.get("DP") || null),
      form: info.get("形態") || null,
      attribute: info.get("属性") || null,
      traits: info.get("タイプ") || null,
      upperText: info.get("上段テキスト") || null,
      lowerText: info.get("下段テキスト") || null,
      imageUrl,
    });
  });

  return cards;
}

export async function fetchDigimonCards(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "CardFlow/0.1 (+product registration; low-frequency fetch)" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`公式サイトの取得に失敗しました（HTTP ${response.status}）`);
  const cards = parseDigimonCards(await response.text(), url);
  if (cards.length === 0) throw new Error("カード情報を検出できませんでした。URLまたは公式サイトの構造を確認してください。 ");
  return cards;
}
