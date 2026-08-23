import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";

const schema = z.object({
  productName: z.string().trim().min(1).max(250),
  productCode: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "商品コードは半角英数字、ハイフン、アンダースコアのみです",
    ),
  salePrice: z.number().int().min(0).nullable(),
  costPrice: z.number().int().min(0).nullable(),
  initialStock: z.number().int().min(0).nullable(),
  departmentId: z.string().trim().max(40),
  category: z.string().trim().max(200),
  exportEnabled: z.boolean(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!pool)
    return NextResponse.json(
      { error: "データベースが接続されていません" },
      { status: 503 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || "入力内容を確認してください",
      },
      { status: 400 },
    );
  const { id } = await context.params;
  const value = parsed.data;
  try {
    const result = await pool.query(
      `UPDATE products SET product_name=$1,product_code=$2,sale_price=$3,cost_price=$4,initial_stock=$5,department_id=$6,category=$7,export_enabled=$8,updated_at=now() WHERE id=$9 RETURNING id`,
      [
        value.productName,
        value.productCode,
        value.salePrice,
        value.costPrice,
        value.initialStock,
        value.departmentId || null,
        value.category || null,
        value.exportEnabled,
        id,
      ],
    );
    if (!result.rowCount)
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 },
      );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505")
      return NextResponse.json(
        { error: "この商品コードは既に使用されています" },
        { status: 409 },
      );
    throw error;
  }
}
