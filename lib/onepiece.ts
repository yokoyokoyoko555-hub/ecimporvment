import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
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

function tableValue(
  $: cheerio.CheerioAPI,
  table: cheerio.Cheerio<AnyNode>,
  label: string,
) {
  let value: string | null = null;
  table.find("tr").each((_, row) => {
    const cells = $(row).find("td");
    cells.each((index, cell) => {
      if (clean($(cell).find("strong").first().text()) === label) {
        value = clean(cells.eq(index + 1).text());
      }
    });
  });
  return value;
}

function fullWidthAmpersand(value: string | null) {
  return value?.replace(/&/g, "＆") || value;
}

/**
 * ティアワンメディアの記事型カードリストを解析する。
 * 記事中の概要表ではなく、カード詳細ブロックだけを対象にする。
 */
export function parseTierOneOnePieceCards(
  html: string,
  pageUrl: string,
): DigimonCard[] {
  const $ = cheerio.load(html);
  const cards: DigimonCard[] = [];

  $("p.wp-block-paragraph").each((_, element) => {
    const metadata = clean($(element).text());
    const match = metadata?.match(
      /^([A-Z][A-Z0-9]*-\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)$/i,
    );
    if (!match) return;

    const metadataNode = $(element);
    const nameNode = metadataNode.nextAll("p.wp-block-paragraph").first();
    const detail = nameNode.nextAll("div.wp-block-columns").first();
    const cardName = fullWidthAmpersand(clean(nameNode.text()));
    const image = detail.find("figure.wp-block-image img").first();
    const rawImage = image.attr("data-src") || image.attr("src");
    const table = detail.find("table").first();
    if (!cardName || !rawImage || !table.length) return;

    const cardNumber = match[1].toUpperCase();
    const rarity = clean(match[2]);
    const cardType = clean(match[3]);
    const color = tableValue($, table, "色");
    const cost = tableValue($, table, "コスト");
    const power = tableValue($, table, "パワー");
    const attribute = tableValue($, table, "属性");
    let traits: string | null = null;
    let effect: string | null = null;
    table.find("td[colspan]").each((__, cell) => {
      const label = clean($(cell).find("strong").first().text());
      const clone = $(cell).clone();
      clone.find("strong").first().remove();
      const value = clean(clone.text());
      if (label === "特徴") traits = value;
      if (label === "テキスト") effect = value;
    });

    cards.push({
      sourceKey: `tierone-${cardNumber.toLowerCase()}-${cards.length + 1}`,
      cardNumber,
      variationCode: "N",
      rarity,
      cardType,
      level: null,
      isParallel: false,
      cardName,
      colors: (color || "")
        .split(/[\/・]/)
        .map((value) => value.trim())
        .filter(Boolean),
      playCost: integer(cost),
      dp: integer(power),
      form: null,
      attribute,
      traits,
      upperText: null,
      lowerText: effect,
      imageUrl: new URL(rawImage.split("?")[0], pageUrl).toString(),
    });
  });

  return cards;
}

export async function fetchOnePieceCards(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "CardFlow/0.1 (+product registration; low-frequency fetch)" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`ONE PIECEカード情報の取得に失敗しました（HTTP ${response.status}）`);
  const html = await response.text();
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const cards = hostname === "tier-one-onepiece.jp"
    ? parseTierOneOnePieceCards(html, url)
    : parseOnePieceCards(html, url);
  if (!cards.length) throw new Error("カード情報を検出できませんでした。対応済みのカードリストURLか確認してください。");
  return cards;
}
