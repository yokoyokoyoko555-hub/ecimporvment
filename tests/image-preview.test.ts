import test from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedOnePieceImageUrl,
  productImagePreviewUrl,
} from "../lib/image-preview";

test("ワンピース公式画像を同一オリジンのプレビュー経由にする", () => {
  const image =
    "https://www.onepiece-cardgame.com/images/cardlist/card/EB05-001.png";
  assert.equal(isAllowedOnePieceImageUrl(image), true);
  assert.equal(
    productImagePreviewUrl("onepiece", image),
    `/api/images/preview?url=${encodeURIComponent(image)}`,
  );
});

test("ティアワン画像もプレビュー経由にする", () => {
  const image = "https://tierone-media-op.com/wp-content/uploads/p-122.webp";
  assert.equal(isAllowedOnePieceImageUrl(image), true);
  assert.match(productImagePreviewUrl("onepiece", image) || "", /^\/api\/images\/preview/);
});

test("任意URLと他タイトル画像はプロキシしない", () => {
  assert.equal(isAllowedOnePieceImageUrl("http://127.0.0.1/image.png"), false);
  assert.equal(isAllowedOnePieceImageUrl("https://example.com/image.png"), false);
  assert.equal(
    productImagePreviewUrl("digimon", "https://example.com/image.png"),
    "https://example.com/image.png",
  );
});
