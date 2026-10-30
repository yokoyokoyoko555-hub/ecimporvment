const ONE_PIECE_IMAGE_HOSTS = new Set([
  "onepiece-cardgame.com",
  "tierone-media-op.com",
]);

export function isAllowedOnePieceImageUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ONE_PIECE_IMAGE_HOSTS.has(url.hostname.replace(/^www\./, ""))
    );
  } catch {
    return false;
  }
}

export function productImagePreviewUrl(
  sourceType: string,
  imageUrl: string | null,
) {
  if (!imageUrl) return null;
  if (sourceType !== "onepiece" || !isAllowedOnePieceImageUrl(imageUrl))
    return imageUrl;
  return `/api/images/preview?url=${encodeURIComponent(imageUrl)}`;
}
