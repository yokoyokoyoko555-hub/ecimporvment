import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  HARRY_POTTER_IMAGE_LIMIT_BYTES,
  prepareImageForExport,
} from "../lib/image-export";

test("500KB未満のハリー・ポッター画像は加工しない", async () => {
  const input = new Uint8Array([1, 2, 3]);
  const output = await prepareImageForExport("harrypotter", input);
  assert.equal(output, input);
});

test("ハリー・ポッター画像をPNGのまま500KB未満にする", async () => {
  const width = 900;
  const height = 1260;
  const pixels = Buffer.allocUnsafe(width * height * 3);
  for (let index = 0; index < pixels.length; index += 1)
    pixels[index] = (index * 31 + Math.floor(index / 97)) % 256;
  const input = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 0 })
    .toBuffer();
  assert.ok(input.byteLength >= HARRY_POTTER_IMAGE_LIMIT_BYTES);

  const output = await prepareImageForExport("harrypotter", input);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, "png");
  assert.ok(output.byteLength < HARRY_POTTER_IMAGE_LIMIT_BYTES);
});

test("他タイトルの画像は500KB以上でも加工しない", async () => {
  const input = new Uint8Array(HARRY_POTTER_IMAGE_LIMIT_BYTES + 1);
  const output = await prepareImageForExport("digimon", input);
  assert.equal(output, input);
});
