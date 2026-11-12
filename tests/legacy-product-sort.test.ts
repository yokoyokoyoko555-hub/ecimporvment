import test from "node:test";
import assert from "node:assert/strict";
import { compareLegacyProductsForExport } from "../lib/legacy-product-sort";

const item = (
  productNumber: string | null,
  productCode: string,
  productName: string,
) => ({
  product_number: productNumber,
  product_code: productCode,
  product_name: productName,
});

test("既存商品は商品番号を数値として昇順にする", () => {
  const products = [
    item("1000", "C", "商品C"),
    item("999", "B", "商品B"),
    item("155", "A", "商品A"),
  ].sort(compareLegacyProductsForExport);
  assert.deepEqual(products.map((product) => product.product_number), ["155", "999", "1000"]);
});

test("未発番商品は既存商品の後にSEC・SR・R、型番順で並べる", () => {
  const products = [
    item(null, "OP02002-01dmg", "【傷あり特価】[状態A-] B 【R】【OP02-002】"),
    item(null, "OP01010-01dmg", "【傷あり特価】[状態A-] C 【SEC】【OP01-010】"),
    item("8483", "deck051", "既存商品"),
    item(null, "OP01002-01dmg", "【傷あり特価】[状態A-] A 【SEC】【OP01-002】"),
    item(null, "OP01001-01dmg", "【傷あり特価】[状態A-] D 【SR】【OP01-001】"),
  ].sort(compareLegacyProductsForExport);
  assert.deepEqual(products.map((product) => product.product_code), [
    "deck051",
    "OP01002-01dmg",
    "OP01010-01dmg",
    "OP01001-01dmg",
    "OP02002-01dmg",
  ]);
});
