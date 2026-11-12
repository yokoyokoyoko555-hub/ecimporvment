import { NextResponse } from "next/server";
import iconv from "iconv-lite";
import { pool } from "@/lib/db";
import { csvLine, ochanokoHeaders } from "@/lib/csv";
import { compareLegacyProductsForExport } from "@/lib/legacy-product-sort";

type ExistingProduct = {
  product_number: string | null;
  product_code: string | null;
  product_name: string;
  category: string | null;
  subcategory: string | null;
  group_name: string | null;
  sale_price: number | null;
  initial_stock: number | null;
  publication_status: string | null;
  raw_data: Record<string, string>;
};

export async function GET() {
  if (!pool) return NextResponse.json({ error: "DB未接続" }, { status: 503 });
  const result = await pool.query<ExistingProduct>(
    `SELECT product_number,product_code,product_name,category,subcategory,group_name,sale_price,
      initial_stock,publication_status,raw_data FROM legacy_ochanoko_products
      WHERE title_key='onepiece'`,
  );
  const headers = ochanokoHeaders();
  const rows = result.rows.sort(compareLegacyProductsForExport).map((product) => {
    const data = { ...product.raw_data };
    Object.assign(data, {
      商品番号: product.product_number,
      商品名: product.product_name,
      "型番/品番": product.product_code || "",
      カテゴリ: product.category || "",
      サブカテゴリ: product.subcategory || "",
      グループ: product.group_name || "",
      販売価格: product.sale_price ?? "",
      在庫数: product.initial_stock ?? "",
      公開状態: product.publication_status || "",
    });
    return csvLine(headers.map((header) => data[header] ?? ""));
  });
  const csv = [csvLine(headers), ...rows].join("\r\n") + "\r\n";
  const body = iconv.encode(csv, "cp932");
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "text/csv; charset=Shift_JIS",
      "Content-Disposition": `attachment; filename="onepiece-existing-products.csv"`,
    },
  });
}
