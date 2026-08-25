import test from "node:test";
import assert from "node:assert/strict";
import {
  ochanokoCategoryName,
  ochanokoSubcategoryName,
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

test("追加タイトルは表示名をカテゴリとして利用する", () => {
  assert.equal(
    ochanokoCategoryName("future-title", "新しいカードタイトル"),
    "新しいカードタイトル",
  );
});
