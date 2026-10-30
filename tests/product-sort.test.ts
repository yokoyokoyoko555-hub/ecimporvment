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

test("ワンピース出力はレアリティ順、型番順になる", () => {
  const cards = [
    { sourceType: "onepiece", variationCode: "N", rarity: "R", cardNumber: "EB05-001" },
    { sourceType: "onepiece", variationCode: "N", rarity: "SR", cardNumber: "EB05-010" },
    { sourceType: "onepiece", variationCode: "N", rarity: "SEC", cardNumber: "EB05-061" },
    { sourceType: "onepiece", variationCode: "N", rarity: "SR", cardNumber: "EB05-002" },
  ].sort(compareProductsForExport);
  assert.deepEqual(
    cards.map((card) => `${card.rarity}:${card.cardNumber}`),
    ["SEC:EB05-061", "SR:EB05-002", "SR:EB05-010", "R:EB05-001"],
  );
});

test("ワンピースのSPはSECを挟まず、傷ありを通常商品の直後にまとめる", () => {
  const cards = [
    { sourceType: "onepiece", variationCode: "P3", rarity: "SP", cardNumber: "EB05-055" },
    { sourceType: "onepiece", variationCode: "N", rarity: "SEC", cardNumber: "EB05-061" },
    { sourceType: "onepiece", variationCode: "P3D", rarity: "SP", cardNumber: "EB05-006" },
    { sourceType: "onepiece", variationCode: "P3", rarity: "SP", cardNumber: "EB05-006" },
    { sourceType: "onepiece", variationCode: "P3D", rarity: "SP", cardNumber: "EB05-055" },
  ].sort(compareProductsForExport);

  assert.deepEqual(
    cards.map((card) => `${card.rarity}:${card.cardNumber}:${card.variationCode}`),
    [
      "SP:EB05-006:P3",
      "SP:EB05-006:P3D",
      "SP:EB05-055:P3",
      "SP:EB05-055:P3D",
      "SEC:EB05-061:N",
    ],
  );
});

test("傷あり商品は対応する通常商品の直後になる", () => {
  const cards = [
    { sourceType: "onepiece", variationCode: "ND", rarity: "SR", cardNumber: "EB05-002" },
    { sourceType: "onepiece", variationCode: "N", rarity: "R", cardNumber: "EB05-001" },
    { sourceType: "onepiece", variationCode: "ND", rarity: "R", cardNumber: "EB05-001" },
    { sourceType: "onepiece", variationCode: "N", rarity: "SR", cardNumber: "EB05-010" },
    { sourceType: "onepiece", variationCode: "N", rarity: "SR", cardNumber: "EB05-002" },
    { sourceType: "onepiece", variationCode: "ND", rarity: "SR", cardNumber: "EB05-010" },
  ].sort(compareProductsForExport);
  assert.deepEqual(
    cards.map((card) => `${card.cardNumber}:${card.variationCode}`),
    [
      "EB05-002:N",
      "EB05-002:ND",
      "EB05-010:N",
      "EB05-010:ND",
      "EB05-001:N",
      "EB05-001:ND",
    ],
  );
});

test("ハリー・ポッター出力は★★、★、通常の各レアリティ・カード番号順になる", () => {
  const cards = [
    { sourceType: "harrypotter", variationCode: "N", rarity: "SR", cardNumber: "HP02-001" },
    { sourceType: "harrypotter", variationCode: "N", rarity: "R★", cardNumber: "HP02-020" },
    { sourceType: "harrypotter", variationCode: "N", rarity: "SR★★", cardNumber: "HP02-010" },
    { sourceType: "harrypotter", variationCode: "N", rarity: "SR★", cardNumber: "HP02-011" },
    { sourceType: "harrypotter", variationCode: "N", rarity: "R★★", cardNumber: "HP02-002" },
    { sourceType: "harrypotter", variationCode: "N", rarity: "R", cardNumber: "HP02-003" },
    { sourceType: "harrypotter", variationCode: "N", rarity: "R★", cardNumber: "HP02-004" },
  ].sort(compareProductsForExport);

  assert.deepEqual(
    cards.map((card) => `${card.rarity}:${card.cardNumber}`),
    [
      "SR★★:HP02-010",
      "R★★:HP02-002",
      "SR★:HP02-011",
      "R★:HP02-004",
      "R★:HP02-020",
      "SR:HP02-001",
      "R:HP02-003",
    ],
  );
});

test("未定義レアリティは定義済みレアリティより後になる", () => {
  const cards = [
    { rarity: "UNKNOWN", cardNumber: "01-001" },
    { rarity: "C", cardNumber: "01-002" },
  ].sort(compareByRarityAndCardNumber);

  assert.equal(cards[0].rarity, "C");
});
