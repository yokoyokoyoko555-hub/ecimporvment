import assert from "node:assert/strict";
import test from "node:test";
import { parseHaikyuCard } from "../lib/haikyu";

test("ハイキュー公式APIカードを商品用データへ変換する", () => {
  const card = parseHaikyuCard({
    ID: "3",
    card_no: "HV-P01-002",
    image_end: "IP",
    name: "日向 翔陽",
    vobarity: "頂P",
    category: "CHARACTER",
    affiliation: "烏野・1年",
    position: "MB",
    skill: "カード効果",
    annotation: "-",
    serve: "2",
    block: "3",
    receive: "1",
    toss: "0",
    attack: "1",
  });
  assert.equal(card.sourceKey, "3");
  assert.equal(card.cardNumber, "HV-P01-002");
  assert.equal(card.variationCode, "IP");
  assert.equal(card.rarity, "頂P");
  assert.equal(card.isParallel, true);
  assert.equal(card.traits, "烏野・1年");
  assert.match(card.upperText || "", /サーブ:2/);
  assert.equal(card.lowerText, "カード効果");
  assert.equal(
    card.imageUrl,
    "https://www.takaratomy.co.jp/products/haikyuvobacabreak/cardlist/card/HV-P01-002-IP.webp",
  );
});
