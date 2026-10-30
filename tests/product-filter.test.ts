import assert from "node:assert/strict";
import test from "node:test";
import { matchesProductDisplayFilter } from "../lib/product-filter";

test("SPとスーパーパラレルを別々に絞り込む", () => {
  const sp = { rarity: "SP", isDamaged: false };
  const superParallel = { rarity: "スーパーパラレル", isDamaged: false };

  assert.equal(matchesProductDisplayFilter(sp, "SP"), true);
  assert.equal(matchesProductDisplayFilter(superParallel, "SP"), false);
  assert.equal(matchesProductDisplayFilter(sp, "スーパーパラレル"), false);
  assert.equal(
    matchesProductDisplayFilter(superParallel, "スーパーパラレル"),
    true,
  );
});

test("傷あり商品だけを絞り込む", () => {
  assert.equal(
    matchesProductDisplayFilter({ rarity: "SP", isDamaged: true }, "damaged"),
    true,
  );
  assert.equal(
    matchesProductDisplayFilter({ rarity: "SP", isDamaged: false }, "damaged"),
    false,
  );
});
