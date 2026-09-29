import test from "node:test";
import assert from "node:assert/strict";
import { ochanokoHeaders } from "../lib/csv";

test("おちゃのこ最新版CSVは193列を所定の順序で出力する", () => {
  const headers = ochanokoHeaders();

  assert.equal(headers.length, 193);
  assert.deepEqual(headers.slice(0, 8), [
    "商品番号",
    "商品名",
    "カテゴリ",
    "サブカテゴリ",
    "型番/品番",
    "JANコード",
    "グループ",
    "販売価格",
  ]);
  assert.equal(headers[11], "ポイント発行除外");
  assert.equal(headers[43], "メイン写真");
  assert.equal(headers[44], "メイン写真タイトル");
  assert.equal(headers[45], "サブ写真1");
  assert.equal(headers[142], "サブ写真タイトル49");
  assert.equal(headers[143], "メイン写真リンクURL");
  assert.equal(headers[144], "説明");
  assert.equal(headers[153], "公開状態");
  assert.equal(headers[159], "他の写真1");
  assert.equal(headers[171], "外部ショッピング：condition");
  assert.equal(headers[192], "管理用メモ");
  assert.equal(headers.includes("garittoカテゴリー"), false);
  assert.equal(headers.includes("説明（スマートフォン版）"), false);
});
