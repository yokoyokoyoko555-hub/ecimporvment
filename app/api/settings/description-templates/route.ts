import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import {
  PRODUCT_DESCRIPTION_FIELDS,
  type ProductDescriptionField,
} from "@/lib/product-description";

const schema = z
  .object({
    titleKey: z.string().trim().min(2).max(40),
    templateText: z.string().trim().min(1).max(5000),
  })
  .superRefine((value, context) => {
    const fields = [...value.templateText.matchAll(/\{\{([a-z_]+)\}\}/g)].map(
      (match) => match[1],
    );
    const invalid = fields.find(
      (field) =>
        !PRODUCT_DESCRIPTION_FIELDS.includes(field as ProductDescriptionField),
    );
    if (invalid)
      context.addIssue({
        code: "custom",
        path: ["templateText"],
        message: `使用できない項目です: ${invalid}`,
      });
  });

export async function PUT(request: Request) {
  if (!pool)
    return NextResponse.json({ error: "DB未接続" }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "入力内容を確認してください" },
      { status: 400 },
    );
  await pool.query(
    `INSERT INTO product_description_templates(title_key,template_text)
     VALUES($1,$2) ON CONFLICT(title_key) DO UPDATE
     SET template_text=EXCLUDED.template_text,updated_at=now()`,
    [parsed.data.titleKey, parsed.data.templateText],
  );
  return NextResponse.json({ ok: true });
}
