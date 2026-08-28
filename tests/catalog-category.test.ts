import test from "node:test";
import assert from "node:assert/strict";
import {
  ochanokoCategoryName,
  ochanokoSubcategoryName,
  ochanokoImagePath,
} from "../lib/catalog-category";

test("おちゃのこカテゴリはタイトル、サブカテゴリは収録名にする", () => {
  assert.equal(
    ochanokoCategoryName("digimon", "デジモンカード"),
    "デジモンカードゲーム",
  );
  assert.equal(
    ochanokoSubcategoryName("ブースターパック TIMELESS BONDS 【BT-26】"),
    "ブースターパック TIMELESS BONDS【BT-26】",
  );
});

test("デジモン画像はおちゃのこ上のDiGiMONフォルダを参照する", () => {
  assert.equal(
    ochanokoImagePath("digimon", "BT26-001.png"),
    "DiGiMON/BT26-001.png",
  );
  assert.equal(ochanokoImagePath("digimon", null), null);
});

test("ハリー・ポッター画像はおちゃのこ上のHPフォルダを参照する", () => {
  assert.equal(
    ochanokoImagePath("harrypotter", "HP_02-001.png"),
    "HP/HP_02-001.png",
  );
});

test("追加タイトルは表示名をカテゴリとして利用する", () => {
  assert.equal(
    ochanokoCategoryName("future-title", "新しいカードタイトル"),
    "新しいカードタイトル",
  );
});
