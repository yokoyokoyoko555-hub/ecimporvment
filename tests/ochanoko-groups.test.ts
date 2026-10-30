import test from "node:test";
import assert from "node:assert/strict";
import {
  parseOchanokoGroups,
  serializeOchanokoGroups,
  toggleOchanokoGroup,
  withDefaultDamagedSaleGroup,
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

test("傷あり商品には既存グループを残してSALEグループを一度だけ追加する", () => {
  assert.equal(
    withDefaultDamagedSaleGroup("リーダーパラレル"),
    "リーダーパラレル\n★SALE★",
  );
  assert.equal(
    withDefaultDamagedSaleGroup("★SALE★\nリーダーパラレル"),
    "★SALE★\nリーダーパラレル",
  );
});
