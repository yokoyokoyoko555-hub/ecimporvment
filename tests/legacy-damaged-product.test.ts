import test from "node:test";
import assert from "node:assert/strict";
import {
  isLegacyDamageCandidate,
  legacyProductRarity,
  withLegacyDamageGroup,
} from "../lib/legacy-damaged-product";

test("パラレルではないSEC・SR・Rを傷あり作成対象にする", () => {
  assert.equal(legacyProductRarity("ナミ 【SEC】【赤】【OP01-001】"), "SEC");
  assert.equal(isLegacyDamageCandidate("ナミ 【SEC】【赤】【OP01-001】", "SEC", "OP01001-01"), true);
  assert.equal(isLegacyDamageCandidate("ナミ 【SR】【赤】【OP01-001】", "SR", "OP01001-01"), true);
  assert.equal(isLegacyDamageCandidate("ナミ 【R】【赤】【OP01-001】", "R", "OP01001-01"), true);
});

test("P・パラレル・SP・作成済み傷ありは対象外にする", () => {
  assert.equal(isLegacyDamageCandidate("ナミ 【P】【赤】【P-001】", "プロモ", "P001-01"), false);
  assert.equal(isLegacyDamageCandidate("ナミ 【SEC】【パラレル】【赤】【OP01-001】", "パラレル", "OP01001-02"), false);
  assert.equal(isLegacyDamageCandidate("ナミ 【SEC】【赤】【OP01-001】", "SP", "OP01001-03"), false);
  assert.equal(isLegacyDamageCandidate("ナミ 【SEC】【赤】【OP01-001】", "SEC", "OP01001-01dmg"), false);
});

test("SEC以下の傷あり専用グループを重複なく追加する", () => {
  assert.equal(withLegacyDamageGroup("SEC"), "SEC\n★SALE★SEC以下");
  assert.equal(
    withLegacyDamageGroup("SEC\n★SALE★SEC以下"),
    "SEC\n★SALE★SEC以下",
  );
});
