import assert from "node:assert/strict";
import test from "node:test";
import { parseLorcanaCard } from "../lib/lorcana";

test("ロルカナ公式APIのカードを商品用データへ変換する", () => {
  const card = parseLorcanaCard(
    {
      collector_number: 1,
      rarity: "レア",
      ink_color: "アンバー",
      card_name: "ウッディ",
      version: "俺が助けるぜ！",
      card_type: "キャラクター",
      rules_text: "\\つかまれ！\\ 効果%次の行",
      flavor_text: "フレーバー",
      ink_cost: 4,
      strength: 2,
      willpower: 4,
      lore_value: 2,
      card_file: "001_DLCS13_Woody_HelpingaFriend_JA",
      classifications: [
        { classification: "ストーリーボーン" },
        { classification: "ヒーロー" },
      ],
    },
    "DLCS13",
  );

  assert.equal(card.cardNumber, "DLCS13-001");
  assert.equal(card.cardName, "ウッディ - 俺が助けるぜ！");
  assert.equal(card.rarity, "レア");
  assert.deepEqual(card.colors, ["アンバー"]);
  assert.equal(card.traits, "ストーリーボーン・ヒーロー");
  assert.equal(card.lowerText, "つかまれ！ 効果\n次の行");
  assert.equal(
    card.imageUrl,
    "https://www.takaratomy.co.jp/products/disneylorcana/cardlist/img/card/001_DLCS13_Woody_HelpingaFriend_JA.png",
  );
});
