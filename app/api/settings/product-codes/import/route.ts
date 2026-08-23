import { NextResponse } from "next/server";
import iconv from "iconv-lite";
import { pool } from "@/lib/db";
import { collectOnePieceSequences, extractLegacyCodes } from "@/lib/legacy-csv";

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
    for (const file of files) {
      const bytes = Buffer.from(await file.arrayBuffer());
      const text = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3).toString("utf8") : iconv.decode(bytes, "cp932");
      records.push(...extractLegacyCodes(text));
    }
    const unique = [...new Map(records.map((record) => [record.productCode, record])).values()];
    if (!unique.length) return NextResponse.json({ error: "商品コードが入った行を確認できませんでした" }, { status: 422 });
    const sequences = collectOnePieceSequences(unique);
    const sourceName = `settings_import_${new Date().toISOString().slice(0, 10)}`;
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const inserted = await client.query<{ product_code: string }>(`INSERT INTO legacy_product_codes(product_code,source_name)
        SELECT code,$2 FROM unnest($1::text[]) code ON CONFLICT(product_code) DO NOTHING RETURNING product_code`, [unique.map((record) => record.productCode), sourceName]);
      if (sequences.size) {
        await client.query(`INSERT INTO product_code_sequences(title_key,base_code,last_branch)
          SELECT 'onepiece',data.base_code,data.last_branch FROM unnest($1::text[],$2::int[]) data(base_code,last_branch)
          ON CONFLICT(title_key,base_code) DO UPDATE SET last_branch=GREATEST(product_code_sequences.last_branch,EXCLUDED.last_branch),updated_at=now()`, [[...sequences.keys()], [...sequences.values()]]);
      }
      const fileNames = files.map((file) => file.name);
      const note = `${fileNames.join("・")}／${unique.length.toLocaleString()}件／${new Date().toISOString().slice(0, 10)}取込`;
      await client.query("UPDATE product_code_rules SET source_note=$1,analyzed_rows=$2,updated_at=now() WHERE title_key='onepiece'", [note, unique.length]);
      await client.query(`INSERT INTO product_code_imports(title_key,file_names,imported_rows,unique_codes,new_codes,sequence_count)
        VALUES('onepiece',$1,$2,$3,$4,$5)`, [fileNames, records.length, unique.length, inserted.rowCount || 0, sequences.size]);
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, files: files.length, rows: records.length, uniqueCodes: unique.length, newCodes: inserted.rowCount || 0, sequences: sequences.size });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally { client.release(); }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "CSVの取込に失敗しました" }, { status: 500 });
  }
}
