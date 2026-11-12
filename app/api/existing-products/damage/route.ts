import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import {
  LEGACY_DAMAGE_GROUP,
  LEGACY_DAMAGE_PUBLICATION_STATUS,
} from "@/lib/legacy-damaged-product";

export async function POST() {
  if (!pool) return NextResponse.json({ error: "DB未接続" }, { status: 503 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{ product_code: string }>(
      `INSERT INTO legacy_ochanoko_products(title_key,product_number,product_code,product_name,category,subcategory,
        group_name,sale_price,initial_stock,publication_status,is_damaged,raw_data,source_file)
      SELECT 'onepiece',NULL,source.product_code || 'dmg',
        '【傷あり特価】[状態A-] ' || source.product_name,source.category,source.subcategory,
        CASE WHEN COALESCE(source.group_name,'')='' THEN $1
          WHEN $1=ANY(regexp_split_to_array(source.group_name,E'\\r?\\n')) THEN source.group_name
          ELSE source.group_name || E'\\n' || $1 END,
        source.sale_price,0,$2,true,
        source.raw_data || jsonb_build_object(
          '商品番号','','商品名','【傷あり特価】[状態A-] ' || source.product_name,
          '型番/品番',source.product_code || 'dmg','グループ',
          CASE WHEN COALESCE(source.group_name,'')='' THEN $1
            WHEN $1=ANY(regexp_split_to_array(source.group_name,E'\\r?\\n')) THEN source.group_name
            ELSE source.group_name || E'\\n' || $1 END,
          '在庫数','0','公開状態',$2::text),
        'generated_damage'
      FROM legacy_ochanoko_products source
      WHERE source.title_key='onepiece' AND source.is_damaged=false AND source.product_code IS NOT NULL
        AND (source.product_name LIKE '%【SEC】%' OR source.product_name LIKE '%【SR】%' OR source.product_name LIKE '%【R】%')
        AND source.product_name NOT LIKE '%パラレル%'
        AND COALESCE(source.group_name,'') NOT LIKE '%パラレル%'
        AND NOT ('SP'=ANY(regexp_split_to_array(COALESCE(source.group_name,''),E'\\r?\\n')))
        AND NOT EXISTS(
          SELECT 1 FROM legacy_ochanoko_products existing
          WHERE existing.title_key='onepiece'
            AND lower(existing.product_code)=lower(source.product_code || 'dmg')
        )
      RETURNING product_code`,
      [LEGACY_DAMAGE_GROUP, LEGACY_DAMAGE_PUBLICATION_STATUS],
    );
    if (result.rows.length) {
      await client.query(
        `INSERT INTO legacy_product_codes(product_code,source_name)
         SELECT code,'existing_product_damage' FROM unnest($1::text[]) code
         ON CONFLICT(product_code) DO NOTHING`,
        [result.rows.map((row) => row.product_code)],
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true, created: result.rows.length });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "傷あり商品の作成に失敗しました" },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
