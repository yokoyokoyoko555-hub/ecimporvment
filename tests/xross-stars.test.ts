import test from "node:test";
import assert from "node:assert/strict";
import { parseXrossStarsCard } from "../lib/xross-stars";

test("Xross Stars公式APIカードを商品用データへ変換する", () => {
  const card = parseXrossStarsCard({
    id: 482,
    card_product: { code: "BP04", name: "ブースターパック第4弾" },
    card_number: "001",
    display_card_number: "BP04-001/081 LR",
    is_parallel: false,
    name: "うぉっか",
    card_rarity: { display_name: "LR" },
    card_type: { display_name: "リーダー" },
    card_color: { name: "赤" },
    atk: 30,
    hp: 100,
    image_url: "https://assets.xross-stars.com/card/BP04/test.png",
  });
  assert.equal(card.sourceKey, "482");
  assert.equal(card.cardNumber, "BP04-001");
  assert.equal(card.rarity, "LR");
  assert.deepEqual(card.colors, ["赤"]);
  assert.equal(card.dp, 30);
  assert.equal(card.upperText, "HP: 100");
});
