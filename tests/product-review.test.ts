import test from "node:test";
import assert from "node:assert/strict";
import { needsDigimonSpReview } from "../lib/product-review";

test("Digimon P2 without SP in its product name requires review", () => {
  assert.equal(
    needsDigimonSpReview(
      "digimon",
      "P2",
      "カード名【パラレル】【BT26-001】【赤】",
    ),
    true,
  );
});

test("review clears after SP is entered in the product name", () => {
  assert.equal(
    needsDigimonSpReview("digimon", "P2", "カード名【SP】【BT26-001】【赤】"),
    false,
  );
});

test("other variations and titles are not treated as Digimon SP", () => {
  assert.equal(needsDigimonSpReview("digimon", "P1", "カード名【パラレル】"), false);
  assert.equal(needsDigimonSpReview("onepiece", "P2", "カード名【パラレル】"), false);
});
