import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { PRODUCT_NAME_FIELDS, type ProductNameField } from "@/lib/product-name";

const schema = z.object({
  titleKey: z.string().trim().min(2).max(40).regex(/^[a-z0-9_-]+$/, "識別キーは半角英数字、ハイフン、アンダースコアで入力してください"),
  displayName: z.string().trim().min(1).max(100),
  templateText: z.string().trim().min(1).max(300),
  multipleColorsLabel: z.string().trim().max(10).nullable(),
}).superRefine((value, ctx) => {
  const found = [...value.templateText.matchAll(/\{\{([a-z_]+)\}\}/g)].map((match) => match[1]);
  const invalid = found.find((field) => !PRODUCT_NAME_FIELDS.includes(field as ProductNameField));
  if (invalid) ctx.addIssue({ code: "custom", path: ["templateText"], message: `使用できない項目です: ${invalid}` });
  if (!found.includes("name") || !found.includes("card_number")) ctx.addIssue({ code: "custom", path: ["templateText"], message: "名前と型番は必須です" });
});

export async function PUT(request: Request) {
  if (!pool) return NextResponse.json({ error: "データベースが接続されていません" }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "入力内容を確認してください" }, { status: 400 });
  const value = parsed.data;
  await pool.query(`INSERT INTO product_name_templates(title_key,display_name,template_text,multiple_colors_label) VALUES($1,$2,$3,$4)
    ON CONFLICT(title_key) DO UPDATE SET display_name=EXCLUDED.display_name,template_text=EXCLUDED.template_text,multiple_colors_label=EXCLUDED.multiple_colors_label,updated_at=now()`,
    [value.titleKey, value.displayName, value.templateText, value.multipleColorsLabel || null]);
  await pool.query(`INSERT INTO catalog_sources(title_key,source_name,acquisition_method,active) VALUES($1,'手動登録','manual',true)
    ON CONFLICT(title_key) DO NOTHING`, [value.titleKey]);
  return NextResponse.json({ ok: true });
}
