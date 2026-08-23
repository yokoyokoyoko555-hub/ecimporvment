import { notFound } from "next/navigation";
import Link from "next/link";
import { pool } from "@/lib/db";
import { ProductEditor, type EditableProduct } from "./product-editor";
import "./products.css";
import "./damage.css";

export const dynamic = "force-dynamic";

type ProductRow = {
  id: string | null;
  source_key: string;
  card_number: string;
  card_name: string;
  rarity: string | null;
  colors: string[];
  is_parallel: boolean;
  source_image_url: string | null;
  product_code: string | null;
  product_name: string | null;
  sale_price: number | null;
  cost_price: number | null;
  initial_stock: number | null;
  department_id: string | null;
  category: string | null;
  export_enabled: boolean | null;
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!pool) notFound();
  const { id } = await params;
  const batchResult = await pool.query<{
    set_name: string;
    set_code: string | null;
    card_count: number;
    status: string;
  }>(
    "SELECT set_name,set_code,card_count,status FROM import_batches WHERE id=$1",
    [id],
  );
  if (!batchResult.rows[0]) notFound();
  const result = await pool.query<ProductRow>(
    `SELECT p.id,c.source_key,c.card_number,c.card_name,c.rarity,c.colors,c.is_parallel,c.source_image_url,p.product_code,p.product_name,p.sale_price,p.cost_price,p.initial_stock,p.department_id,p.category,p.export_enabled
    FROM cards c LEFT JOIN LATERAL(SELECT px.* FROM products px JOIN cards pc ON pc.id=px.card_id WHERE pc.card_number=c.card_number AND pc.variation_code=c.variation_code LIMIT 1)p ON true
    WHERE c.import_batch_id=$1 ORDER BY c.card_number,c.variation_code`,
    [id],
  );
  const batch = batchResult.rows[0];
  const defaultCategory = batch.set_name.replace(/\s+【/g, "【").trim();
  const products: EditableProduct[] = result.rows.map((row) => ({
    id: row.id,
    sourceKey: row.source_key,
    cardNumber: row.card_number,
    cardName: row.card_name,
    rarity: row.rarity,
    colors: row.colors,
    isParallel: row.is_parallel,
    imageUrl: row.source_image_url,
    productCode: row.product_code || "",
    productName: row.product_name || row.card_name,
    salePrice: row.sale_price,
    costPrice: row.cost_price,
    initialStock: row.initial_stock,
    departmentId: row.department_id || "",
    category: row.category || defaultCategory,
    exportEnabled: row.export_enabled ?? true,
    isDamaged: row.product_code?.endsWith("dmg") ?? false,
    createDamaged: false,
  }));
  return (
    <>
      <header className="topline">
        <div>
          <div className="eyebrow">Import detail</div>
          <h1>{batch.set_name}</h1>
          <p className="subtitle">
            {batch.set_code}・{batch.card_count}件・{batch.status}
          </p>
        </div>
        <div className="headerActions">
          <Link className="button secondary" href="/imports">
            取込一覧へ
          </Link>
          <Link className="button" href={`/exports?batch=${id}`}>
            出力へ
          </Link>
        </div>
      </header>
      <ProductEditor initialProducts={products} batchId={id} />
    </>
  );
}
