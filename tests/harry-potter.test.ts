import test from "node:test";
import assert from "node:assert/strict";
import {
  findHarryPotterProduct,
  parseHarryPotterCard,
  type HarryPotterDetail,
} from "../lib/harry-potter";

const detail: HarryPotterDetail = {
  id: 201,
  cardNumber: "02-003(holo)",
  cardName: "ハリー・ポッター",
  cardType: { id: 8, value: "Character" },
  rarity: { id: 14, value: "SR" },
  cost: 5,
  mp: null,
  ap: 5,
  dp: 4,
  text: "カードテキスト",
  parallel: true,
  tags: [
    { id: 11, value: "グリフィンドール" },
    { id: 10, value: "ホグワーツ" },
  ],
  products: [{ id: 7, value: "ブースターパック Part.2" }],
  imageUrl: "https://example.com/card.png",
};

test("ハリー・ポッター公式APIの詳細を商品用カードへ変換する", () => {
  const card = parseHarryPotterCard(detail);
  assert.equal(card.cardNumber, "02-003(holo)");
  assert.equal(card.variationCode, "HOLO");
  assert.equal(card.rarity, "SR");
  assert.equal(card.isParallel, true);
  assert.equal(card.traits, "グリフィンドール/ホグワーツ");
  assert.equal(card.upperText, "AP: 5");
});

test("商品セット名の末尾に管理コードがあっても公式収録商品を特定する", () => {
  const product = findHarryPotterProduct(
    [
      {
        id: 7,
        value: "ブースターパック／『ハリー・ポッターと賢者の石』 Part.2",
      },
    ],
    "ブースターパック／『ハリー・ポッターと賢者の石』 Part.2【HP02】",
    "HP02",
  );
  assert.equal(product?.id, 7);
});
