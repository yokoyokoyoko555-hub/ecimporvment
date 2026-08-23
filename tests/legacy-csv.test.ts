import test from "node:test";
import assert from "node:assert/strict";
import { collectOnePieceSequences, extractLegacyCodes, parseCsvRows } from "../lib/legacy-csv";

test("quoted commas, quotes and line breaks are parsed", () => {
  const rows = parseCsvRows('商品名,型番/品番,説明\r\n"シャンクス,特別版",OP17022-01,"1行目\r\n2行目"\r\n"ナミ ""SP""",OP02036-03,説明\r\n');
  assert.equal(rows.length, 3);
  assert.equal(rows[1][0], "シャンクス,特別版");
  assert.equal(rows[1][2], "1行目\r\n2行目");
  assert.equal(rows[2][0], 'ナミ "SP"');
});

test("product codes and highest branches are extracted", () => {
  const csv = '商品番号,商品名,型番/品番,改行は<br />タグに置換する,改行は<br />タグに置換する\r\n1,シャンクス 【SEC】【緑】【OP17-022】,OP17022-01,,\r\n2,シャンクス 【スーパーパラレル】【緑】【OP17-022】,OP17022-04,,\r\n3,【傷あり特価】[状態A-] シャンクス 【SEC】【緑】【OP17-022】,OP17022-04dmg,,\r\n';
  const records = extractLegacyCodes(csv);
  assert.equal(records.length, 3);
  assert.equal(collectOnePieceSequences(records).get("OP17022"), 4);
});
