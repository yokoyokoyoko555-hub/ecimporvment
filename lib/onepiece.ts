import * as cheerio from "cheerio";
import type { DigimonCard } from "@/lib/digimon";

const clean = (value: string | undefined) => value?.replace(/\s+/g, " ").trim() || null;
const integer = (value: string | null) => value && /^\d+$/.test(value) ? Number(value) : null;

function displayedRarity(rawRarity: string | null, variationCode: string, variants: number) {
  if (variationCode === "N") return rawRarity;
  if (rawRarity === "L") return "リーダーパラレル";
  const number = Number(variationCode.replace(/^P/i, "")) || 1;
  if (number >= 2 && variants >= 2) return "スーパーパラレル";
  return "パラレル";
}

export function parseOnePieceCards(html: string, pageUrl: string): DigimonCard[] {
  const $ = cheerio.load(html);
  const variantCounts = new Map<string, number>();
  $("dl.modalCol").each((_, element) => {
    const sourceKey = $(element).attr("id") || "";
    const cardNumber = clean($(element).find(".infoCol span").first().text());
    if (cardNumber && sourceKey.startsWith(`${cardNumber}_p`)) variantCounts.set(cardNumber, (variantCounts.get(cardNumber) || 0) + 1);
  });
  const cards: DigimonCard[] = [];
  $("dl.modalCol").each((_, element) => {
    const modal = $(element);
    const sourceKey = modal.attr("id")?.trim();
    const info = modal.find(".infoCol span").map((__, span) => clean($(span).text())).get();
    const cardNumber = info[0];
    const rawRarity = info[1];
    const cardType = info[2];
    const cardName = clean(modal.find(".cardName").first().text());
    if (!sourceKey || !cardNumber || !cardName) return;
    const suffix = sourceKey.slice(cardNumber.length).replace(/^_/, "");
    const variationCode = suffix ? suffix.toUpperCase() : "N";
    const rawImage = modal.find(".frontCol img").first().attr("data-src") || modal.find(".frontCol img").first().attr("src");
    const imageUrl = rawImage ? new URL(rawImage.split("?")[0], pageUrl).toString() : null;
    const color = clean(modal.find(".color").first().clone().children("h3").remove().end().text());
    const attribute = modal.find(".attribute img").first().attr("alt") || null;
    const traits = clean(modal.find(".feature").first().clone().children("h3").remove().end().text());
    const effect = clean(modal.find(".text").first().clone().children("h3").remove().end().text());
    const cost = clean(modal.find(".cost").first().clone().children("h3").remove().end().text());
    const power = clean(modal.find(".power").first().clone().children("h3").remove().end().text());
    cards.push({
      sourceKey, cardNumber, variationCode, rarity: displayedRarity(rawRarity, variationCode, variantCounts.get(cardNumber) || 0),
      cardType, level: null, isParallel: variationCode !== "N", cardName,
      colors: (color || "").split(/[\/・]/).map((value) => value.trim()).filter(Boolean),
      playCost: integer(cost), dp: integer(power), form: null, attribute, traits,
      upperText: null, lowerText: effect, imageUrl,
    });
  });
  return cards;
}

export async function fetchOnePieceCards(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "CardFlow/0.1 (+product registration; low-frequency fetch)" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`ONE PIECE公式サイトの取得に失敗しました（HTTP ${response.status}）`);
  const cards = parseOnePieceCards(await response.text(), url);
  if (!cards.length) throw new Error("カード情報を検出できませんでした。シリーズを選択した公式カードリストURLか確認してください。");
  return cards;
}
