import { NextResponse } from "next/server";
import JSZip from "jszip";
import iconv from "iconv-lite";
import { z } from "zod";
import { pool } from "@/lib/db";
import { csvLine, ochanokoHeaders } from "@/lib/csv";

interface ProductRow { product_code: string; product_name: string; sale_price: number | null; cost_price: number | null; initial_stock: number; department_id: string | null; category: string | null; subcategory: string | null; group_name: string | null; description_html: string | null; image_file_name: string | null; source_image_url: string | null; card_number: string; card_name: string; rarity: string | null; colors: string[] }
const querySchema = z.object({ batch: z.string().uuid(), type: z.enum(["ochanoko", "smaregi", "images"]) });

async function load(batchId: string) {
  if (!pool) throw new Error("データベースが接続されていません");
  return (await pool.query<ProductRow>(`SELECT p.product_code,p.product_name,p.sale_price,p.cost_price,p.initial_stock,p.department_id,p.category,p.subcategory,p.group_name,p.description_html,p.image_file_name,c.source_image_url,c.card_number,c.card_name,c.rarity,c.colors
    FROM cards c JOIN products p ON p.card_id=c.id
    WHERE c.import_batch_id=$1 AND p.export_enabled=true ORDER BY c.card_number,c.variation_code,p.created_at`, [batchId])).rows;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({ batch: url.searchParams.get("batch"), type: url.searchParams.get("type") });
    if (!parsed.success) return NextResponse.json({ error: "出力条件が正しくありません" }, { status: 400 });
    const products = await load(parsed.data.batch);
    if (!products.length) return NextResponse.json({ error: "出力対象の商品がありません" }, { status: 422 });

    if (parsed.data.type === "smaregi") {
      const invalid = products.filter((product) => product.sale_price === null || !product.department_id || !product.product_code);
      if (invalid.length) return NextResponse.json({ error: `スマレジ必須項目が未入力の商品が${invalid.length}件あります。販売価格・部門ID・商品コードを確認してください。` }, { status: 422 });
      const lines = [csvLine(["商品ID", "部門ID", "商品コード", "商品名", "原価", "商品単価", "免税区分"]), ...products.map((product) => csvLine(["", product.department_id, product.product_code, product.product_name, product.cost_price, product.sale_price, 0]))];
      return file(iconv.encode(lines.join("\r\n") + "\r\n", "cp932"), "text/csv", "smaregi.csv");
    }

    if (parsed.data.type === "ochanoko") {
      const invalid = products.filter((product) => product.sale_price === null || !product.category || !product.product_code);
      if (invalid.length) return NextResponse.json({ error: `おちゃのこ必須項目が未入力の商品が${invalid.length}件あります。販売価格・カテゴリ・商品コードを確認してください。` }, { status: 422 });
      const headers = ochanokoHeaders();
      if (headers.length !== 204) return NextResponse.json({ error: `おちゃのこCSVの列数エラーです（${headers.length}列）` }, { status: 500 });
      const rows = products.map((product) => {
        const values = Array(204).fill("");
        const set = (name: string, value: unknown) => { const index = headers.indexOf(name); if (index >= 0) values[index] = value ?? ""; };
        set("商品名", product.product_name); set("型番/品番", product.product_code); set("カテゴリ", product.category); set("サブカテゴリ", product.subcategory); set("グループ", product.group_name); set("販売価格", product.sale_price); set("在庫数", product.initial_stock); set("メイン写真1", product.image_file_name); set("説明", product.description_html || `${product.product_name}の商品詳細です。`); set("SEO：タイトル", product.product_name); set("SEO：ディスクリプション", `${product.product_name}の商品詳細です。`);
        return csvLine(values);
      });
      return file(iconv.encode([csvLine(headers), ...rows].join("\r\n") + "\r\n", "cp932"), "text/csv", "ochanoko.csv");
    }

    const zip = new JSZip();
    const manifest = [csvLine(["商品コード", "カード番号", "画像ファイル名", "取得元URL", "結果"])];
    for (let start = 0; start < products.length; start += 8) {
      await Promise.all(products.slice(start, start + 8).map(async (product) => {
        if (!product.source_image_url) { manifest.push(csvLine([product.product_code, product.card_number, "", "", "画像URLなし"])); return; }
        const name = product.image_file_name || `${product.product_code}.png`;
        try {
          const response = await fetch(product.source_image_url, { signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          zip.file(name, await response.arrayBuffer());
          manifest.push(csvLine([product.product_code, product.card_number, name, product.source_image_url, "取得成功"]));
        } catch {
          manifest.push(csvLine([product.product_code, product.card_number, name, product.source_image_url, "取得失敗"]));
        }
      }));
    }
    zip.file("manifest.csv", iconv.encode(manifest.join("\r\n") + "\r\n", "cp932"));
    return file(await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" }), "application/zip", "images.zip");
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "出力処理に失敗しました" }, { status: 500 });
  }
}

function file(body: Uint8Array, type: string, name: string) {
  return new NextResponse(new Uint8Array(body).buffer, { headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
}
