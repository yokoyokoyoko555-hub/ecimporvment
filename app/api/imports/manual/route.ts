import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { renderProductName } from "@/lib/product-name";
import { resolveProductCode } from "@/lib/product-code";

const cardSchema = z.object({
  cardName: z.string().trim().min(1, "カード名を入力してください").max(200),
  cardNumber: z.string().trim().min(1, "型番を入力してください").max(80),
  rarity: z.string().trim().max(40).nullable().optional(),
  colors: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  isParallel: z.boolean().default(false),
  createDamaged: z.boolean().default(false),
  imageUrl: z.union([z.string().url("画像URLを確認してください"), z.literal("")]).nullable().optional(),
  productCode: z.string().trim().max(100).regex(/^[A-Za-z0-9_-]*$/, "商品コードは半角英数字・ハイフン・アンダーバーで入力してください").optional(),
  productName: z.string().trim().max(300).optional(),
  salePrice: z.number().int().min(0).nullable().optional(),
  costPrice: z.number().int().min(0).nullable().optional(),
  initialStock: z.number().int().min(0).default(0),
  departmentId: z.string().trim().max(50).nullable().optional(),
  category: z.string().trim().max(200).nullable().optional(),
});

const schema = z.object({
  titleKey: z.string().trim().min(1),
  setName: z.string().trim().min(1, "商品セット名を入力してください").max(200),
  setCode: z.string().trim().min(1, "セットコードを入力してください").max(40),
  cards: z.array(cardSchema).min(1, "カードを1件以上入力してください").max(100),
});

export async function POST(request: Request) {
  if (!pool) return NextResponse.json({ error: "データベースが接続されていません" }, { status: 503 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "入力内容を確認してください" }, { status: 400 });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const templateResult = await client.query<{ template_text: string; multiple_colors_label: string | null }>(
      "SELECT template_text, multiple_colors_label FROM product_name_templates WHERE title_key=$1",
      [parsed.data.titleKey],
    );
    const template = templateResult.rows[0];
    if (!template) throw new Error("選択したタイトルの商品名テンプレートが見つかりません");

    const totalProducts = parsed.data.cards.reduce((count, card) => count + (card.createDamaged ? 2 : 1), 0);
    const batchResult = await client.query<{ id: string }>(`INSERT INTO import_batches(source_type, source_url, set_name, set_code, status, card_count, fetched_at)
      VALUES('manual', 'manual://entry', $1, $2, 'needs_review', $3, now()) RETURNING id`,
      [parsed.data.setName, parsed.data.setCode, totalProducts]);
    const batchId = batchResult.rows[0].id;

    for (let index = 0; index < parsed.data.cards.length; index += 1) {
      const card = parsed.data.cards[index];
      const productCode = await resolveProductCode(client, parsed.data.titleKey, card.cardNumber, card.productCode);
      const variationCode = card.isParallel ? "P" : "N";
      const sourceKey = `manual-${card.cardNumber}-${variationCode}-${index + 1}`;
      const cardResult = await client.query<{ id: string }>(`INSERT INTO cards(
        import_batch_id, source_key, card_number, variation_code, rarity, is_parallel, card_name, colors, source_image_url, raw_data)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [
        batchId, sourceKey, card.cardNumber, variationCode, card.rarity || null, card.isParallel,
        card.cardName, card.colors, card.imageUrl || null, JSON.stringify({ entryType: "manual" }),
      ]);
      const generatedName = renderProductName(
        { templateText: template.template_text, multipleColorsLabel: template.multiple_colors_label },
        { name: card.cardName, rarity: card.rarity, colors: card.colors, cardNumber: card.cardNumber, setCode: parsed.data.setCode, isParallel: card.isParallel },
      );
      await client.query(`INSERT INTO products(
        card_id, product_code, product_name, sale_price, cost_price, initial_stock, department_id, category, image_file_name)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
        cardResult.rows[0].id, productCode, card.productName || generatedName,
        card.salePrice ?? null, card.costPrice ?? null, card.initialStock,
        card.departmentId || null, card.category || null, card.imageUrl ? `${productCode}.jpg` : null,
      ]);
      if (card.createDamaged) {
        const damagedCode = `${productCode}dmg`;
        const existingDamaged = await client.query("SELECT 1 FROM legacy_product_codes WHERE product_code=$1 UNION ALL SELECT 1 FROM products WHERE product_code=$1 LIMIT 1", [damagedCode]);
        if (existingDamaged.rowCount) throw new Error(`傷あり商品コード「${damagedCode}」はすでに使用されています`);
        const damagedCard = await client.query<{ id: string }>(`INSERT INTO cards(
          import_batch_id, source_key, card_number, variation_code, rarity, is_parallel, card_name, colors, source_image_url, raw_data)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [
          batchId, `${sourceKey}-dmg`, card.cardNumber, `${variationCode}D`, card.rarity || null, card.isParallel,
          card.cardName, card.colors, card.imageUrl || null, JSON.stringify({ entryType: "manual", condition: "A-", damaged: true }),
        ]);
        await client.query(`INSERT INTO products(
          card_id, product_code, product_name, sale_price, cost_price, initial_stock, department_id, category, image_file_name)
          VALUES($1,$2,$3,NULL,NULL,0,$4,$5,$6)`, [
          damagedCard.rows[0].id, damagedCode, `【傷あり特価】[状態A-] ${card.productName || generatedName}`,
          card.departmentId || null, card.category || null, card.imageUrl ? `${damagedCode}.jpg` : null,
        ]);
      }
    }
    await client.query("COMMIT");
    return NextResponse.json({ id: batchId, cardCount: totalProducts });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "同じ商品コードがすでに登録されています" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "手動登録に失敗しました" }, { status: 500 });
  } finally {
    client.release();
  }
}
