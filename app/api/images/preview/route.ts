import { NextResponse } from "next/server";
import { isAllowedOnePieceImageUrl } from "@/lib/image-preview";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function GET(request: Request) {
  const sourceUrl = new URL(request.url).searchParams.get("url") || "";
  if (!isAllowedOnePieceImageUrl(sourceUrl))
    return NextResponse.json(
      { error: "許可されていない画像URLです" },
      { status: 400 },
    );
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "CardFlow/0.1 (+product registration; image preview proxy)",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok)
      return NextResponse.json(
        { error: `画像の取得に失敗しました（HTTP ${response.status}）` },
        { status: 502 },
      );
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/"))
      return NextResponse.json(
        { error: "取得先が画像ではありません" },
        { status: 502 },
      );
    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_IMAGE_BYTES)
      return NextResponse.json(
        { error: "画像サイズが上限を超えています" },
        { status: 413 },
      );
    const image = new Uint8Array(await response.arrayBuffer());
    if (image.byteLength > MAX_IMAGE_BYTES)
      return NextResponse.json(
        { error: "画像サイズが上限を超えています" },
        { status: 413 },
      );
    return new NextResponse(image.buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "画像の取得に失敗しました" },
      { status: 502 },
    );
  }
}
