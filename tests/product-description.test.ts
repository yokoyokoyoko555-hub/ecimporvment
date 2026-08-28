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
      traits: "小型/レッサー型",
    },
  );
  assert.equal(
    result,
    "ニャロモン【U】【EX12-001】【黄】<br />収録：DIGITAL WORLD SHAMBALA【EX-12】<br />型番：EX12-001<br />色：黄",
  );
});

test("標準商品説明へ収録名・商品名・特徴を差し込む", () => {
  const result = renderProductDescription(
    "{{set_name}}<br />{{product_name}}<br />特徴:{{traits}}",
    {
      productName: "ロロノア・ゾロ 【リーダーパラレル】【赤】【OP01-001】",
      cardName: "ロロノア・ゾロ",
      rarity: "L",
      colors: ["赤"],
      cardNumber: "OP01-001",
      setName: "ROMANCE DAWN OP-01",
      setCode: "OP-01",
      traits: "超新星/麦わらの一味",
    },
  );
  assert.equal(
    result,
    "ROMANCE DAWN OP-01<br />ロロノア・ゾロ 【リーダーパラレル】【赤】【OP01-001】<br />特徴:超新星/麦わらの一味",
  );
});
