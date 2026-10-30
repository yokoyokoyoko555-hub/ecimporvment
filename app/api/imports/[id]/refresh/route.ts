import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { fetchOnePieceCards } from "@/lib/onepiece";
import {
  DEFAULT_PRODUCT_NAME_TEMPLATES,
  renderProductName,
} from "@/lib/product-name";
import { resolveProductCode } from "@/lib/product-code";
import { onePieceDefaultSalePrice } from "@/lib/onepiece-price";
import {
  ochanokoCategoryName,
  ochanokoSubcategoryName,
} from "@/lib/catalog-category";

const paramsSchema = z.object({ id: z.string().uuid() });

function sourceProvider(sourceUrl: string) {
  return new URL(sourceUrl).hostname.replace(/^www\./, "") ===
    "tier-one-onepiece.jp"
    ? "ティアワンメディア（非公式）"
    : "ONE PIECEカードゲーム公式";
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!pool)
    return NextResponse.json(
      { error: "データベースが接続されていません" },
      { status: 503 },
    );
  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success)
    return NextResponse.json({ error: "取込IDが正しくありません" }, { status: 400 });

  const batchResult = await pool.query<{
    id: string;
    source_type: string;
    source_url: string;
    set_name: string;
    set_code: string | null;
  }>(
    "SELECT id,source_type,source_url,set_name,set_code FROM import_batches WHERE id=$1",
    [parsed.data.id],
  );
  const batch = batchResult.rows[0];
  if (!batch)
    return NextResponse.json({ error: "取込データが見つかりません" }, { status: 404 });
  if (batch.source_type !== "onepiece")
    return NextResponse.json(
      { error: "現在、再取込はワンピースカードだけに対応しています" },
      { status: 422 },
    );

  try {
    const cards = await fetchOnePieceCards(batch.source_url);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM import_batches WHERE id=$1 FOR UPDATE", [
        batch.id,
      ]);
      const templateResult = await client.query<{
        template_text: string;
        multiple_colors_label: string | null;
      }>(
        "SELECT template_text,multiple_colors_label FROM product_name_templates WHERE title_key='onepiece'",
      );
      const template = templateResult.rows[0]
        ? {
            templateText: templateResult.rows[0].template_text,
            multipleColorsLabel: templateResult.rows[0].multiple_colors_label,
          }
        : DEFAULT_PRODUCT_NAME_TEMPLATES.onepiece;
      const existing = await client.query<{ source_key: string }>(
        "SELECT source_key FROM cards WHERE import_batch_id=$1",
        [batch.id],
      );
      const existingKeys = new Set(existing.rows.map((row) => row.source_key));
      const fetchedKeys = new Set(cards.map((card) => card.sourceKey));
      let added = 0;
      let updated = 0;

      for (const card of cards) {
        const rawData = JSON.stringify({
          ...card,
          sourceProvider: sourceProvider(batch.source_url),
          refreshedAt: new Date().toISOString(),
        });
        if (existingKeys.has(card.sourceKey)) {
          await client.query(
            `UPDATE cards SET card_number=$1,variation_code=$2,rarity=$3,card_type=$4,level=$5,is_parallel=$6,card_name=$7,colors=$8,play_cost=$9,dp=$10,form=$11,attribute=$12,traits=$13,upper_text=$14,lower_text=$15,source_image_url=$16,raw_data=$17
             WHERE import_batch_id=$18 AND source_key=$19`,
            [
              card.cardNumber,
              card.variationCode,
              card.rarity,
              card.cardType,
              card.level,
              card.isParallel,
              card.cardName,
              card.colors,
              card.playCost,
              card.dp,
              card.form,
              card.attribute,
              card.traits,
              card.upperText,
              card.lowerText,
              card.imageUrl,
              rawData,
              batch.id,
              card.sourceKey,
            ],
          );
          await client.query(
            `UPDATE cards SET rarity=$1,card_type=$2,level=$3,is_parallel=$4,card_name=$5,colors=$6,play_cost=$7,dp=$8,form=$9,attribute=$10,traits=$11,upper_text=$12,lower_text=$13,source_image_url=$14,raw_data=$15
             WHERE import_batch_id=$16 AND source_key=$17`,
            [
              card.rarity,
              card.cardType,
              card.level,
              card.isParallel,
              card.cardName,
              card.colors,
              card.playCost,
              card.dp,
              card.form,
              card.attribute,
              card.traits,
              card.upperText,
              card.lowerText,
              card.imageUrl,
              rawData,
              batch.id,
              `${card.sourceKey}-dmg`,
            ],
          );
          updated += 1;
          continue;
        }

        const inserted = await client.query<{ id: string }>(
          `INSERT INTO cards(import_batch_id,source_key,card_number,variation_code,rarity,card_type,level,is_parallel,card_name,colors,play_cost,dp,form,attribute,traits,upper_text,lower_text,source_image_url,raw_data)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id`,
          [
            batch.id,
            card.sourceKey,
            card.cardNumber,
            card.variationCode,
            card.rarity,
            card.cardType,
            card.level,
            card.isParallel,
            card.cardName,
            card.colors,
            card.playCost,
            card.dp,
            card.form,
            card.attribute,
            card.traits,
            card.upperText,
            card.lowerText,
            card.imageUrl,
            rawData,
          ],
        );
        const productCode = await resolveProductCode(
          client,
          "onepiece",
          card.cardNumber,
          null,
        );
        const productName = renderProductName(template, {
          name: card.cardName,
          rarity: card.rarity,
          colors: card.colors,
          cardNumber: card.cardNumber,
          setCode: batch.set_code,
          isParallel: card.isParallel,
        });
        await client.query(
          `INSERT INTO products(card_id,product_code,product_name,image_file_name,category,subcategory,sale_price,initial_stock)
           VALUES($1,$2,$3,$4,$5,$6,$7,0)`,
          [
            inserted.rows[0].id,
            productCode,
            productName,
            card.imageUrl ? `${productCode}.png` : null,
            ochanokoCategoryName("onepiece", "ワンピースカード"),
            ochanokoSubcategoryName(batch.set_name),
            onePieceDefaultSalePrice(card.rarity) ?? 0,
          ],
        );
        added += 1;
      }

      const countResult = await client.query<{ count: string }>(
        "SELECT count(*) FROM cards WHERE import_batch_id=$1",
        [batch.id],
      );
      const total = Number(countResult.rows[0].count);
      const retained = [...existingKeys].filter(
        (key) => !fetchedKeys.has(key) && !key.endsWith("-dmg"),
      ).length;
      await client.query(
        "UPDATE import_batches SET status='needs_review',card_count=$1,fetched_at=now(),updated_at=now(),error_message=NULL WHERE id=$2",
        [total, batch.id],
      );
      await client.query("COMMIT");
      return NextResponse.json({ added, updated, retained, total });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "再取込に失敗しました" },
      { status: 500 },
    );
  }
}
