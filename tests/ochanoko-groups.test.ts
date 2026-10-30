import test from "node:test";
import assert from "node:assert/strict";
import {
  parseOchanokoGroups,
  serializeOchanokoGroups,
  toggleOchanokoGroup,
} from "../lib/ochanoko-groups";

test("複数のおちゃのこグループをセル内改行で保存する", () => {
  const value = serializeOchanokoGroups(["SP", "★SALE★", "SP"]);
  assert.equal(value, "SP\n★SALE★");
  assert.deepEqual(parseOchanokoGroups(value), ["SP", "★SALE★"]);
});

test("グループ選択時も既存の未知グループを保持する", () => {
  assert.equal(
    toggleOchanokoGroup("鑑定にオススメ！\nSP", "パラレル", true),
    "鑑定にオススメ！\nSP\nパラレル",
  );
  assert.equal(
    toggleOchanokoGroup("鑑定にオススメ！\nSP", "SP", false),
    "鑑定にオススメ！",
  );
});
