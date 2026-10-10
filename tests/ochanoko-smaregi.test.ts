import test from "node:test";
import assert from "node:assert/strict";
import iconv from "iconv-lite";
import {
  buildSmaregiCsv,
  convertOchanokoRowsToSmaregi,
  decodeOchanokoCsv,
} from "../lib/ochanoko-smaregi";

const source = [
  "商品名,型番/品番,販売価格,サブカテゴリ",
  "ルフィ 【P】【赤】【P-001】,P001-01,1200,",
  "商品コードなし,,,プロモ",
].join("\r\n");

test("おちゃのこ商品CSVをスマレジ7列へ変換する", () => {
  const result = convertOchanokoRowsToSmaregi(source, "12");
  assert.equal(result.skipped, 1);
  assert.deepEqual(result.rows, [
    [
      "",
      "12",
      "P001-01",
      "ルフィ 【P】【赤】【P-001】",
      "",
      "1200",
      "0",
    ],
  ]);
  const output = buildSmaregiCsv(result.rows);
  assert.match(output, /^商品ID,部門ID,商品コード,商品名,原価,商品単価,免税区分\r\n/);
});

test("UTF-8 BOMとCP932のおちゃのこCSVを判別して読み込む", () => {
  const utf8 = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(source)]);
  assert.equal(decodeOchanokoCsv(utf8), source);
  assert.equal(decodeOchanokoCsv(iconv.encode(source, "cp932")), source);
});

test("スマレジ部門IDは必須", () => {
  assert.throws(
    () => convertOchanokoRowsToSmaregi(source, ""),
    /部門IDを入力してください/,
  );
});
