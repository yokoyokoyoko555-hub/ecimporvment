import test from "node:test";
import assert from "node:assert/strict";
import { compareByRarityAndCardNumber } from "../lib/product-sort";

test("レアリティが高い順、その中ではカード番号の数値順になる", () => {
  const cards = [
    { rarity: "R", cardNumber: "BT26-010" },
    { rarity: "SR", cardNumber: "BT26-011" },
    { rarity: "R", cardNumber: "BT26-002" },
    { rarity: "SEC", cardNumber: "BT26-101" },
  ].sort(compareByRarityAndCardNumber);

  assert.deepEqual(
    cards.map((card) => `${card.rarity}:${card.cardNumber}`),
    ["SEC:BT26-101", "SR:BT26-011", "R:BT26-002", "R:BT26-010"],
  );
});

test("未定義レアリティは定義済みレアリティより後になる", () => {
  const cards = [
    { rarity: "UNKNOWN", cardNumber: "01-001" },
    { rarity: "C", cardNumber: "01-002" },
  ].sort(compareByRarityAndCardNumber);

  assert.equal(cards[0].rarity, "C");
});
