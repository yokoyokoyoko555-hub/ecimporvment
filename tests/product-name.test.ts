import test from "node:test";
import assert from "node:assert/strict";
import { renderProductName } from "../lib/product-name";

test("複数色の専用表示が空欄なら中黒なしで色を連結する", () => {
  assert.equal(
    renderProductName(
      { templateText: "{{name}}【{{color}}】", multipleColorsLabel: null },
      {
        name: "カード名",
        colors: ["赤", "青"],
        cardNumber: "XX01-001",
      },
    ),
    "カード名【赤青】",
  );
});

test("複数色の専用表示がある場合はその表示を優先する", () => {
  assert.equal(
    renderProductName(
      { templateText: "{{name}}【{{color}}】", multipleColorsLabel: "多" },
      {
        name: "カード名",
        colors: ["赤", "青"],
        cardNumber: "XX01-001",
      },
    ),
    "カード名【多】",
  );
});
