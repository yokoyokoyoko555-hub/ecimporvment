import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { renderProductName } from "@/lib/product-name";
import { fetchXrossStarsCards } from "@/lib/xross-stars";

const schema = z
  .object({
    sourceUrl: z.string().url(),
    setName: z.string().trim().min(1).max(200),
    setCode: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/),
  })
  .superRefine((value, context) => {
    const host = new URL(value.sourceUrl).hostname.replace(/^www\./, "");
    if (host !== "xross-stars.com")
      context.addIssue({
        code: "custom",
        path: ["sourceUrl"],
        message: "Xross Starsの公式カードリストURLを入力してください",
      });
  });

export async function POST(request: Request) {
  if (!pool)
    return NextResponse.json(
      { error: "データベースが接続されていません" },
      { status: 503 },
    );
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "入力内容を確認してください" },
      { status: 400 },
    );
  const { sourceUrl, setName, setCode } = parsed.data;
  const existing = await pool.query<{ id: string }>(
    "SELECT id FROM import_batches WHERE source_type='xross-stars' AND lower(trim(set_code))=lower(trim($1)) AND status<>'failed' ORDER BY created_at LIMIT 1",
    [setCode],
  );
  if (existing.rows[0])
    return NextResponse.json(
      { error: "同じ商品セットは既に取り込まれています", existingId: existing.rows[0].id },
      { status: 409 },
    );

  try {
    const cards = await fetchXrossStarsCards(setCode);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const batch = await client.query<{ id: string }>(
        `INSERT INTO import_batches(source_type,source_url,set_name,set_code,status)
         VALUES('xross-stars',$1,$2,$3,'fetching') RETURNING id`,
        [sourceUrl, setName, setCode],
      );
      const batchId = batch.rows[0].id;
      const templateResult = await client.query<{
        template_text: string;
        multiple_colors_label: string | null;
      }>("SELECT template_text,multiple_colors_label FROM product_name_templates WHERE title_key='xross-stars'");
      if (!templateResult.rows[0])
        throw new Error("Xross Starsの商品名テンプレートが見つかりません");
      const template = {
        templateText: templateResult.rows[0].template_text,
        multipleColorsLabel: templateResult.rows[0].multiple_colors_label,
      };
      const category = setName.replace(/\s+【/g, "【").trim();
      for (const card of cards) {
        const inserted = await client.query<{ id: string }>(
          `INSERT INTO cards(import_batch_id,source_key,card_number,variation_code,rarity,card_type,level,is_parallel,card_name,colors,play_cost,dp,form,attribute,traits,upper_text,lower_text,source_image_url,raw_data)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
          [batchId,card.sourceKey,card.cardNumber,card.variationCode,card.rarity,card.cardType,card.level,card.isParallel,card.cardName,card.colors,card.playCost,card.dp,card.form,card.attribute,card.traits,card.upperText,card.lowerText,card.imageUrl,JSON.stringify(card)],
        );
        const productCode = `XS_${card.cardNumber}_N`.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
        const productName = renderProductName(template, {
          name: card.cardName,
          rarity: card.rarity,
          colors: card.colors,
          cardNumber: card.cardNumber,
          setCode,
          isParallel: card.isParallel,
        });
        await client.query(
          `INSERT INTO products(card_id,product_code,product_name,image_file_name,category)
           VALUES($1,$2,$3,$4,$5)`,
          [inserted.rows[0].id, productCode, productName, `${productCode}.png`, category],
        );
      }
      await client.query(
        "UPDATE import_batches SET status='needs_review',card_count=$1,fetched_at=now(),updated_at=now() WHERE id=$2",
        [cards.length, batchId],
      );
      await client.query("COMMIT");
      return NextResponse.json({ id: batchId, cardCount: cards.length });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    if (error instanceof Error && "code" in error && error.code === "23505")
      return NextResponse.json(
        { error: "同じ商品セットまたは商品コードが既に登録されています" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "取込に失敗しました" },
      { status: 500 },
    );
  }
}
