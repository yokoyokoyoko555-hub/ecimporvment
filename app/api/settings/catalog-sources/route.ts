import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";

const schema = z
  .object({
    titleKey: z.string().trim().min(2).max(40),
    sourceName: z.string().trim().min(1).max(100),
    acquisitionMethod: z.enum(["manual", "scraping"]),
    scraperKey: z
      .enum([
        "digimon",
        "onepiece",
        "lorcana",
        "xross-stars",
        "harrypotter",
      ])
      .nullable(),
    defaultUrl: z.union([z.string().url(), z.literal("")]).nullable(),
    active: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.acquisitionMethod === "scraping" && !value.scraperKey)
      context.addIssue({
        code: "custom",
        path: ["scraperKey"],
        message: "対応済みスクレイパーを選択してください",
      });
    if (value.acquisitionMethod === "scraping" && !value.defaultUrl)
      context.addIssue({
        code: "custom",
        path: ["defaultUrl"],
        message: "標準URLを入力してください",
      });
  });

export async function PUT(request: Request) {
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
  const value = parsed.data;
  const template = await pool.query(
    "SELECT 1 FROM product_name_templates WHERE title_key=$1",
    [value.titleKey],
  );
  if (!template.rowCount)
    return NextResponse.json(
      { error: "先に商品名テンプレートでタイトルを登録してください" },
      { status: 404 },
    );
  await pool.query(
    `INSERT INTO catalog_sources(title_key,source_name,acquisition_method,scraper_key,default_url,active)
    VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(title_key) DO UPDATE SET source_name=EXCLUDED.source_name,acquisition_method=EXCLUDED.acquisition_method,scraper_key=EXCLUDED.scraper_key,default_url=EXCLUDED.default_url,active=EXCLUDED.active,updated_at=now()`,
    [
      value.titleKey,
      value.sourceName,
      value.acquisitionMethod,
      value.acquisitionMethod === "scraping" ? value.scraperKey : null,
      value.acquisitionMethod === "scraping" ? value.defaultUrl : null,
      value.active,
    ],
  );
  return NextResponse.json({ ok: true });
}
