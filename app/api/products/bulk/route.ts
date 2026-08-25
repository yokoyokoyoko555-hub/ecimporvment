import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";

const item = z.object({
  id: z.string().uuid(),
  productName: z.string().trim().min(1),
  productCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]+$/),
  salePrice: z.number().int().min(0).nullable(),
  costPrice: z.number().int().min(0).nullable(),
  initialStock: z.number().int().min(0).nullable(),
  departmentId: z.string(),
  category: z.string(),
  subcategory: z.string(),
  exportEnabled: z.boolean(),
  createDamaged: z.boolean().default(false),
});
const schema = z.object({
  batchId: z.string().uuid(),
  products: z.array(item).max(500),
});

export async function POST(request: Request) {
  if (!pool) return NextResponse.json({ error: "DB未接続" }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "入力エラー" },
      { status: 400 },
    );
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const reserved = await client.query<{ product_code: string }>(
      "SELECT product_code FROM legacy_product_codes WHERE product_code=ANY($1::text[]) LIMIT 1",
      [parsed.data.products.map((product) => product.productCode)],
    );
    if (reserved.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: `商品コード「${reserved.rows[0].product_code}」は池袋店の既存商品で使用されています`,
        },
        { status: 409 },
      );
    }
    let createdDamaged = 0;
    for (const product of parsed.data.products) {
      await client.query(
        `UPDATE products SET product_name=$1,product_code=$2,sale_price=$3,cost_price=$4,initial_stock=$5,department_id=$6,category=$7,subcategory=$8,export_enabled=$9,updated_at=now() WHERE id=$10`,
        [
          product.productName,
          product.productCode,
          product.salePrice,
          product.costPrice,
          product.initialStock,
          product.departmentId || null,
          product.category || null,
          product.subcategory || null,
          product.exportEnabled,
          product.id,
        ],
      );
      if (product.createDamaged && !product.productCode.endsWith("dmg")) {
        const damagedCode = `${product.productCode}dmg`;
        const existing = await client.query(
          "SELECT 1 FROM products WHERE product_code=$1",
          [damagedCode],
        );
        if (existing.rowCount) continue;
        const legacy = await client.query(
          "SELECT 1 FROM legacy_product_codes WHERE product_code=$1",
          [damagedCode],
        );
        if (legacy.rowCount)
          throw new Error(
            `傷あり商品コード「${damagedCode}」は池袋店の既存商品で使用されています`,
          );
        const source = await client.query<{
          id: string;
          import_batch_id: string;
          source_key: string;
          card_number: string;
          variation_code: string;
          rarity: string | null;
          card_type: string | null;
          level: string | null;
          is_parallel: boolean;
          card_name: string;
          colors: string[];
          play_cost: number | null;
          dp: number | null;
          form: string | null;
          attribute: string | null;
          traits: string | null;
          upper_text: string | null;
          lower_text: string | null;
          source_image_url: string | null;
          image_object_key: string | null;
          raw_data: object;
          image_file_name: string | null;
        }>(
          `SELECT c.*,p.image_file_name FROM cards c JOIN products p ON p.card_id=c.id WHERE p.id=$1`,
          [product.id],
        );
        const card = source.rows[0];
        if (!card) throw new Error("傷あり商品の元カードが見つかりません");
        const damagedCard = await client.query<{ id: string }>(
          `INSERT INTO cards(import_batch_id,source_key,card_number,variation_code,rarity,card_type,level,is_parallel,card_name,colors,play_cost,dp,form,attribute,traits,upper_text,lower_text,source_image_url,image_object_key,raw_data)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`,
          [
            card.import_batch_id,
            `${card.source_key}-dmg`,
            card.card_number,
            `${card.variation_code}D`,
            card.rarity,
            card.card_type,
            card.level,
            card.is_parallel,
            card.card_name,
            card.colors,
            card.play_cost,
            card.dp,
            card.form,
            card.attribute,
            card.traits,
            card.upper_text,
            card.lower_text,
            card.source_image_url,
            card.image_object_key,
            JSON.stringify({
              ...card.raw_data,
              damaged: true,
              condition: "A-",
            }),
          ],
        );
        const extension =
          card.image_file_name?.match(/(\.[A-Za-z0-9]+)$/)?.[1] ||
          (card.source_image_url ? ".jpg" : "");
        const damagedName = product.productName.startsWith("【傷あり特価】")
          ? product.productName
          : `【傷あり特価】[状態A-] ${product.productName}`;
        await client.query(
          `INSERT INTO products(card_id,product_code,product_name,sale_price,cost_price,initial_stock,department_id,category,subcategory,image_file_name,export_enabled)
          VALUES($1,$2,$3,NULL,NULL,NULL,$4,$5,$6,$7,true)`,
          [
            damagedCard.rows[0].id,
            damagedCode,
            damagedName,
            product.departmentId || null,
            product.category || null,
            product.subcategory || null,
            extension ? `${damagedCode}${extension}` : null,
          ],
        );
        createdDamaged += 1;
      }
    }
    await client.query(
      "UPDATE import_batches SET card_count=(SELECT count(*) FROM cards WHERE import_batch_id=$1) WHERE id=$1",
      [parsed.data.batchId],
    );
    const result = await client.query<{ count: string }>(
      `SELECT count(*) FROM cards ca JOIN LATERAL(SELECT px.* FROM products px JOIN cards pc ON pc.id=px.card_id WHERE pc.card_number=ca.card_number AND pc.variation_code=ca.variation_code AND px.export_enabled=true LIMIT 1)p ON true WHERE ca.import_batch_id=$1 AND(p.category IS NULL OR trim(p.category)='' OR p.subcategory IS NULL OR trim(p.subcategory)='' OR p.product_code='')`,
      [parsed.data.batchId],
    );
    const missing = Number(result.rows[0].count);
    await client.query(
      "UPDATE import_batches SET status=$1,updated_at=now() WHERE id=$2",
      [missing ? "needs_review" : "ready", parsed.data.batchId],
    );
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, missing, createdDamaged });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && "code" in error && error.code === "23505")
      return NextResponse.json(
        { error: "商品コードが重複しています" },
        { status: 409 },
      );
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存に失敗しました" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
