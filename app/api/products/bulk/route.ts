import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";

const item = z.object({ id: z.string().uuid(), productName: z.string().trim().min(1), productCode: z.string().trim().regex(/^[A-Za-z0-9_-]+$/), salePrice: z.number().int().min(0).nullable(), costPrice: z.number().int().min(0).nullable(), initialStock: z.number().int().min(0), departmentId: z.string(), category: z.string(), exportEnabled: z.boolean() });
const schema = z.object({ batchId: z.string().uuid(), products: z.array(item).max(500) });

export async function POST(request: Request) {
  if (!pool) return NextResponse.json({ error: "DB未接続" }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "入力エラー" }, { status: 400 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const reserved = await client.query<{ product_code: string }>("SELECT product_code FROM legacy_product_codes WHERE product_code=ANY($1::text[]) LIMIT 1", [parsed.data.products.map((product) => product.productCode)]);
    if (reserved.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: `商品コード「${reserved.rows[0].product_code}」は池袋店の既存商品で使用されています` }, { status: 409 });
    }
    for (const product of parsed.data.products) {
      await client.query(`UPDATE products SET product_name=$1,product_code=$2,sale_price=$3,cost_price=$4,initial_stock=$5,department_id=$6,category=$7,export_enabled=$8,updated_at=now() WHERE id=$9`, [product.productName, product.productCode, product.salePrice, product.costPrice, product.initialStock, product.departmentId || null, product.category || null, product.exportEnabled, product.id]);
    }
    const result = await client.query<{ count: string }>(`SELECT count(*) FROM cards ca JOIN LATERAL(SELECT px.* FROM products px JOIN cards pc ON pc.id=px.card_id WHERE pc.card_number=ca.card_number AND pc.variation_code=ca.variation_code AND px.export_enabled=true LIMIT 1)p ON true WHERE ca.import_batch_id=$1 AND(p.sale_price IS NULL OR p.department_id IS NULL OR p.category IS NULL OR p.product_code='')`, [parsed.data.batchId]);
    const missing = Number(result.rows[0].count);
    await client.query("UPDATE import_batches SET status=$1,updated_at=now() WHERE id=$2", [missing ? "needs_review" : "ready", parsed.data.batchId]);
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, missing });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && "code" in error && error.code === "23505") return NextResponse.json({ error: "商品コードが重複しています" }, { status: 409 });
    throw error;
  } finally {
    client.release();
  }
}
