import sharp from "sharp";

export const HARRY_POTTER_IMAGE_LIMIT_BYTES = 500_000;

export async function prepareImageForExport(
  sourceType: string,
  input: Uint8Array,
) {
  if (
    sourceType !== "harrypotter" ||
    input.byteLength < HARRY_POTTER_IMAGE_LIMIT_BYTES
  )
    return input;

  const metadata = await sharp(input).metadata();
  const originalWidth = metadata.width || 1000;
  const attempts = [
    { width: originalWidth, quality: 90 },
    { width: Math.min(originalWidth, 900), quality: 85 },
    { width: Math.min(originalWidth, 800), quality: 80 },
    { width: Math.min(originalWidth, 700), quality: 75 },
    { width: Math.min(originalWidth, 600), quality: 70 },
    { width: Math.min(originalWidth, 500), quality: 65 },
  ];
  for (const attempt of attempts) {
    const output = await sharp(input)
      .resize({ width: attempt.width, withoutEnlargement: true })
      .png({
        compressionLevel: 9,
        effort: 10,
        palette: true,
        quality: attempt.quality,
      })
      .toBuffer();
    if (output.byteLength < HARRY_POTTER_IMAGE_LIMIT_BYTES) return output;
  }
  throw new Error(
    "ハリー・ポッター画像を500KB未満に圧縮できませんでした",
  );
}
