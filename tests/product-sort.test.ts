import test from "node:test";
import assert from "node:assert/strict";
import {
  compareByRarityAndCardNumber,
  compareProductsForExport,
} from "../lib/product-sort";

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

test("デジモン出力はP2、P1、通常レアリティ順になる", () => {
  const cards = [
    { sourceType: "digimon", variationCode: "N", rarity: "SEC", cardNumber: "BT26-100" },
    { sourceType: "digimon", variationCode: "P1", rarity: "SR", cardNumber: "BT26-010" },
    { sourceType: "digimon", variationCode: "P2", rarity: "R", cardNumber: "BT26-020" },
    { sourceType: "digimon", variationCode: "P2", rarity: "SR", cardNumber: "BT26-002" },
    { sourceType: "digimon", variationCode: "P1", rarity: "R", cardNumber: "BT26-001" },
    { sourceType: "digimon", variationCode: "N", rarity: "SR", cardNumber: "BT26-001" },
  ].sort(compareProductsForExport);

  assert.deepEqual(
    cards.map((card) => `${card.variationCode}:${card.cardNumber}`),
    [
      "P2:BT26-002",
      "P2:BT26-020",
      "P1:BT26-001",
      "P1:BT26-010",
      "N:BT26-100",
      "N:BT26-001",
    ],
  );
});

test("デジモン以外の出力は従来どおりレアリティ順になる", () => {
  const cards = [
    { sourceType: "onepiece", variationCode: "P2", rarity: "R", cardNumber: "OP01-001" },
    { sourceType: "onepiece", variationCode: "N", rarity: "SEC", cardNumber: "OP01-100" },
  ].sort(compareProductsForExport);
  assert.equal(cards[0].rarity, "SEC");
});

test("未定義レアリティは定義済みレアリティより後になる", () => {
  const cards = [
    { rarity: "UNKNOWN", cardNumber: "01-001" },
    { rarity: "C", cardNumber: "01-002" },
  ].sort(compareByRarityAndCardNumber);

  assert.equal(cards[0].rarity, "C");
});
