import Link from "next/link";
import { pool } from "@/lib/db";
import { ProductCodeImport } from "@/app/settings/product-code-import";
import { ExistingProductRow, type ExistingProductItem } from "./existing-product-row";
import "./existing-products.css";
import "../settings/product-code-import.css";

export const dynamic = "force-dynamic";

export default async function ExistingProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim();
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 50;
  let total = 0;
  let items: ExistingProductItem[] = [];
  if (pool) {
    const where = q
      ? "WHERE title_key='onepiece' AND(product_number ILIKE $1 OR product_code ILIKE $1 OR product_name ILIKE $1)"
      : "WHERE title_key='onepiece'";
    const values = q ? [`%${q}%`] : [];
    const count = await pool.query<{ count: string }>(
      `SELECT count(*) FROM legacy_ochanoko_products ${where}`,
      values,
    );
    total = Number(count.rows[0]?.count || 0);
    const result = await pool.query<{
      id: string; product_number: string; product_code: string | null; product_name: string;
      category: string | null; subcategory: string | null; group_name: string | null;
      sale_price: number | null; initial_stock: number | null; publication_status: string | null;
      is_damaged: boolean;
    }>(
      `SELECT id,product_number,product_code,product_name,category,subcategory,group_name,sale_price,
       initial_stock,publication_status,is_damaged FROM legacy_ochanoko_products ${where}
       ORDER BY product_number DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      values,
    );
    items = result.rows.map((row) => ({
      id: row.id, productNumber: row.product_number, productCode: row.product_code || "",
      productName: row.product_name, category: row.category || "", subcategory: row.subcategory || "",
      groupName: row.group_name || "", salePrice: row.sale_price, initialStock: row.initial_stock,
      publicationStatus: row.publication_status || "", isDamaged: row.is_damaged,
    }));
  }
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (target: number) => `/existing-products?page=${target}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  return <>
    <header className="topline"><div><div className="eyebrow">Existing products</div><h1>既存おちゃのこ商品</h1><p className="subtitle">ワンピースカードの商品番号を保持し、既存商品を修正・上書きします。</p></div><Link className="button" href="/api/existing-products/export">商品番号付きCSVを出力</Link></header>
    <section className="panel existingImport"><ProductCodeImport /></section>
    <form className="existingSearch" action="/existing-products"><input name="q" defaultValue={q} placeholder="商品番号・商品コード・商品名で検索" /><button className="button" type="submit">検索</button><span>{total.toLocaleString()}件</span></form>
    <div className="existingProductList">{items.map((item) => <ExistingProductRow initial={item} key={item.id} />)}{!items.length && <div className="empty panel">既存商品CSVを取り込むと、ここに商品が表示されます。</div>}</div>
    {pages > 1 && <nav className="existingPagination">{page > 1 && <Link href={href(page - 1)}>前へ</Link>}<span>{page} / {pages}</span>{page < pages && <Link href={href(page + 1)}>次へ</Link>}</nav>}
  </>;
}
