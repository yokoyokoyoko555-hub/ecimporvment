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

test("未発番商品は指定シリーズごとにSEC・SR・R、型番順で並べる", () => {
  const products = [
    item(null, "ST01002-01dmg", "【傷あり特価】[状態A-] ST 【SEC】【ST01-002】"),
    item(null, "PRB01002-01dmg", "【傷あり特価】[状態A-] PRB 【SEC】【PRB01-002】"),
    item(null, "EB01002-01dmg", "【傷あり特価】[状態A-] EB 【SEC】【EB01-002】"),
    item(null, "OP02002-01dmg", "【傷あり特価】[状態A-] B 【SEC】【OP02-002】"),
    item(null, "OP17-118-01dmg", "【傷あり特価】[状態A-] E 【SEC】【OP17-118】"),
    item(null, "OP01010-01dmg", "【傷あり特価】[状態A-] C 【SEC】【OP01-010】"),
    item("8483", "deck051", "既存商品"),
    item(null, "OP01002-01dmg", "【傷あり特価】[状態A-] A 【SEC】【OP01-002】"),
    item(null, "OP01001-01dmg", "【傷あり特価】[状態A-] D 【SR】【OP01-001】"),
  ].sort(compareLegacyProductsForExport);
  assert.deepEqual(products.map((product) => product.product_code), [
    "deck051",
    "OP01002-01dmg",
    "OP01010-01dmg",
    "OP02002-01dmg",
    "OP17-118-01dmg",
    "OP01001-01dmg",
    "EB01002-01dmg",
    "PRB01002-01dmg",
    "ST01002-01dmg",
  ]);
});
