import { NextResponse } from "next/server";
import iconv from "iconv-lite";
import { pool } from "@/lib/db";
import {
  collectOnePieceSequences,
  extractLegacyCodes,
  extractLegacyOchanokoProducts,
} from "@/lib/legacy-csv";

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: Request) {
  if (!pool) return NextResponse.json({ error: "データベースが接続されていません" }, { status: 503 });
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    if (!files.length) return NextResponse.json({ error: "CSVファイルを選択してください" }, { status: 400 });
    if (files.length > 10) return NextResponse.json({ error: "一度に選択できるCSVは10ファイルまでです" }, { status: 400 });
    if (files.some((file) => file.size > MAX_FILE_SIZE)) return NextResponse.json({ error: "1ファイルの上限は25MBです" }, { status: 413 });

    const records = [];
    const catalogProducts = [];
    let skippedWithoutNumber = 0;
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const text = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3).toString("utf8") : iconv.decode(bytes, "cp932");
      records.push(...extractLegacyCodes(text));
      const catalog = extractLegacyOchanokoProducts(text);
      catalogProducts.push(
        ...catalog.products.map((product) => ({ ...product, sourceFile: file.name })),
      );
      skippedWithoutNumber += catalog.skippedWithoutNumber;
    }
    const unique = [...new Map(records.map((record) => [record.productCode, record])).values()];
    if (!catalogProducts.length) return NextResponse.json({ error: "商品番号が入った既存商品を確認できませんでした" }, { status: 422 });
    const sequences = collectOnePieceSequences(unique);
    const sourceName = `settings_import_${new Date().toISOString().slice(0, 10)}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let newCodes = 0;
      if (unique.length) {
        const inserted = await client.query<{ product_code: string }>(`INSERT INTO legacy_product_codes(product_code,source_name)
          SELECT code,$2 FROM unnest($1::text[]) code ON CONFLICT(product_code) DO NOTHING RETURNING product_code`, [unique.map((record) => record.productCode), sourceName]);
        newCodes = inserted.rowCount || 0;
      }
      if (sequences.size) {
        await client.query(`INSERT INTO product_code_sequences(title_key,base_code,last_branch)
          SELECT 'onepiece',data.base_code,data.last_branch FROM unnest($1::text[],$2::int[]) data(base_code,last_branch)
          ON CONFLICT(title_key,base_code) DO UPDATE SET last_branch=GREATEST(product_code_sequences.last_branch,EXCLUDED.last_branch),updated_at=now()`, [[...sequences.keys()], [...sequences.values()]]);
      }
      if (catalogProducts.length) {
        const latestProducts = [
          ...new Map(
            catalogProducts.map((product) => [product.productNumber, product]),
          ).values(),
        ];
        const importedCodes = latestProducts
          .map((product) => product.productCode.toLowerCase())
          .filter(Boolean);
        if (importedCodes.length) {
          await client.query(
            `DELETE FROM legacy_ochanoko_products
             WHERE title_key='onepiece' AND product_number IS NULL
               AND lower(product_code)=ANY($1::text[])`,
            [importedCodes],
          );
        }
        await client.query(
          `INSERT INTO legacy_ochanoko_products(title_key,product_number,product_code,product_name,category,subcategory,group_name,sale_price,initial_stock,publication_status,is_damaged,raw_data,source_file)
          SELECT 'onepiece',x.product_number,NULLIF(x.product_code,''),x.product_name,NULLIF(x.category,''),
            NULLIF(x.subcategory,''),NULLIF(x.group_name,''),x.sale_price,x.initial_stock,
            NULLIF(x.publication_status,''),x.is_damaged,x.raw_data,x.source_file
          FROM jsonb_to_recordset($1::jsonb) AS x(product_number text,product_code text,product_name text,
            category text,subcategory text,group_name text,sale_price integer,initial_stock integer,
            publication_status text,is_damaged boolean,raw_data jsonb,source_file text)
          ON CONFLICT(title_key,product_number) DO UPDATE SET
            product_code=EXCLUDED.product_code,product_name=EXCLUDED.product_name,category=EXCLUDED.category,
            subcategory=EXCLUDED.subcategory,group_name=EXCLUDED.group_name,sale_price=EXCLUDED.sale_price,
            initial_stock=EXCLUDED.initial_stock,publication_status=EXCLUDED.publication_status,
            is_damaged=EXCLUDED.is_damaged,raw_data=EXCLUDED.raw_data,source_file=EXCLUDED.source_file,updated_at=now()`,
          [
            JSON.stringify(
              latestProducts.map((product) => ({
                product_number: product.productNumber,
                product_code: product.productCode,
                product_name: product.productName,
                category: product.category,
                subcategory: product.subcategory,
                group_name: product.groupName,
                sale_price: product.salePrice,
                initial_stock: product.initialStock,
                publication_status: product.publicationStatus,
                is_damaged: product.isDamaged,
                raw_data: product.rawData,
                source_file: product.sourceFile,
              })),
            ),
          ],
        );
      }
      const fileNames = files.map((file) => file.name);
      const note = `${fileNames.join("・")}／${unique.length.toLocaleString()}件／${new Date().toISOString().slice(0, 10)}取込`;
      await client.query("UPDATE product_code_rules SET source_note=$1,analyzed_rows=$2,updated_at=now() WHERE title_key='onepiece'", [note, unique.length]);
      await client.query(`INSERT INTO product_code_imports(title_key,file_names,imported_rows,unique_codes,new_codes,sequence_count)
        VALUES('onepiece',$1,$2,$3,$4,$5)`, [fileNames, records.length, unique.length, newCodes, sequences.size]);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, files: files.length, rows: records.length, uniqueCodes: unique.length, newCodes, sequences: sequences.size, catalogProducts: catalogProducts.length, skippedWithoutNumber });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "CSVの取込に失敗しました" }, { status: 500 });
  }
}
