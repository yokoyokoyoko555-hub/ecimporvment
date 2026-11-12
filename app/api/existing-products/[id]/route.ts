import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { withDefaultDamagedSaleGroup } from "@/lib/ochanoko-groups";

const updateSchema = z.object({
  productName: z.string().trim().min(1),
  productCode: z.string().trim().max(100),
  category: z.string().trim().max(500),
  subcategory: z.string().trim().max(500),
  groupName: z.string().max(2000),
  salePrice: z.number().int().min(0).nullable(),
  initialStock: z.number().int().min(0).nullable(),
  publicationStatus: z.string().trim().max(100),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!pool) return NextResponse.json({ error: "DB未接続" }, { status: 503 });
  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
  const value = parsed.data;
  const result = await pool.query(
    `UPDATE legacy_ochanoko_products SET product_name=$1,product_code=$2,category=$3,subcategory=$4,
      group_name=$5,sale_price=$6,initial_stock=$7,publication_status=$8,
      raw_data=raw_data || jsonb_build_object('商品名',$1::text,'型番/品番',$2::text,'カテゴリ',$3::text,
        'サブカテゴリ',$4::text,'グループ',$5::text,'販売価格',COALESCE($6::text,''),
        '在庫数',COALESCE($7::text,''),'公開状態',$8::text),updated_at=now()
      WHERE id=$9 AND title_key='onepiece' RETURNING id`,
    [
      value.productName,
      value.productCode || null,
      value.category || null,
      value.subcategory || null,
      value.groupName || null,
      value.salePrice,
      value.initialStock,
      value.publicationStatus || null,
      id,
    ],
  );
  if (!result.rowCount)
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
  if (value.productCode) {
    await pool.query(
      "INSERT INTO legacy_product_codes(product_code,source_name) VALUES($1,'existing_product_edit') ON CONFLICT(product_code) DO NOTHING",
      [value.productCode],
    );
  }
  return NextResponse.json({ ok: true });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!pool) return NextResponse.json({ error: "DB未接続" }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  if (body.action !== "damage")
    return NextResponse.json({ error: "操作が不正です" }, { status: 400 });
  const current = await pool.query<{
    product_name: string;
    product_code: string | null;
    group_name: string | null;
    is_damaged: boolean;
  }>(
    "SELECT product_name,product_code,group_name,is_damaged FROM legacy_ochanoko_products WHERE id=$1 AND title_key='onepiece'",
    [id],
  );
  const product = current.rows[0];
  if (!product)
    return NextResponse.json({ error: "商品が見つかりません" }, { status: 404 });
  if (product.is_damaged) return NextResponse.json({ ok: true });
  const productName = product.product_name.startsWith("【傷あり特価】")
    ? product.product_name
    : `【傷あり特価】[状態A-] ${product.product_name}`;
  const productCode =
    product.product_code && !product.product_code.toLowerCase().endsWith("dmg")
      ? `${product.product_code}dmg`
      : product.product_code;
  if (productCode) {
    const duplicate = await pool.query(
      "SELECT 1 FROM legacy_ochanoko_products WHERE title_key='onepiece' AND lower(product_code)=lower($1) AND id<>$2 LIMIT 1",
      [productCode, id],
    );
    if (duplicate.rowCount)
      return NextResponse.json(
        { error: `商品コード「${productCode}」は別の商品で使用されています` },
        { status: 409 },
      );
  }
  const groupName = withDefaultDamagedSaleGroup(product.group_name || "");
  await pool.query(
    `UPDATE legacy_ochanoko_products SET product_name=$1,product_code=$2,group_name=$3,is_damaged=true,
      raw_data=raw_data || jsonb_build_object('商品名',$1::text,'型番/品番',COALESCE($2::text,''),'グループ',$3::text),updated_at=now()
      WHERE id=$4`,
    [productName, productCode, groupName, id],
  );
  if (productCode) {
    await pool.query(
      "INSERT INTO legacy_product_codes(product_code,source_name) VALUES($1,'existing_product_damage') ON CONFLICT(product_code) DO NOTHING",
      [productCode],
    );
  }
  return NextResponse.json({ ok: true, productName, productCode, groupName });
}
