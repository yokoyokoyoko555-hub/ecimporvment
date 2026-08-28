import test from "node:test";
import assert from "node:assert/strict";
import { appendDigimonVariationLabel } from "../lib/product-name";

test("デジモンP1の商品名末尾へパラレル表記を追加する", () => {
  assert.equal(
    appendDigimonVariationLabel("カード名【SR】【BT26-001】【赤】", "P1"),
    "カード名【SR】【BT26-001】【赤】【パラレル】",
  );
});

test("デジモンP2の商品名末尾へSP・希少表記を追加する", () => {
  assert.equal(
    appendDigimonVariationLabel("カード名【SR】【BT26-001】【赤】", "p2"),
    "カード名【SR】【BT26-001】【赤】【SP・希少】",
  );
});

test("通常カードと追加済みの商品名は変更しない", () => {
  assert.equal(appendDigimonVariationLabel("通常カード", "N"), "通常カード");
  assert.equal(
    appendDigimonVariationLabel("カード名【パラレル】", "P1"),
    "カード名【パラレル】",
  );
});
