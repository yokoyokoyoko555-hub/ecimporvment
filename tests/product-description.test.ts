import test from "node:test";
import assert from "node:assert/strict";
import { renderProductDescription } from "../lib/product-description";

test("商品説明テンプレートへカード情報を差し込む", () => {
  const result = renderProductDescription(
    "{{product_name}}<br />収録：{{set_name}}<br />型番：{{card_number}}<br />色：{{color}}",
    {
      productName: "ニャロモン【U】【EX12-001】【黄】",
      cardName: "ニャロモン",
      rarity: "U",
      colors: ["黄"],
      cardNumber: "EX12-001",
      setName: "DIGITAL WORLD SHAMBALA【EX-12】",
      setCode: "EX-12",
    },
  );
  assert.equal(
    result,
    "ニャロモン【U】【EX12-001】【黄】<br />収録：DIGITAL WORLD SHAMBALA【EX-12】<br />型番：EX12-001<br />色：黄",
  );
});
