import assert from "node:assert/strict";
import test from "node:test";
import { onePieceDefaultSalePrice } from "../lib/onepiece-price";

test("ワンピースのR・UC・Cへ初期販売価格を設定する", () => {
  assert.equal(onePieceDefaultSalePrice("R"), 80);
  assert.equal(onePieceDefaultSalePrice("UC"), 50);
  assert.equal(onePieceDefaultSalePrice("C"), 30);
});

test("指定外のレアリティには初期販売価格を設定しない", () => {
  assert.equal(onePieceDefaultSalePrice("SR"), null);
  assert.equal(onePieceDefaultSalePrice(null), null);
});
