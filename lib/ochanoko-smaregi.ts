import iconv from "iconv-lite";
import { csvLine } from "@/lib/csv";
import { parseCsvRows } from "@/lib/legacy-csv";

export const SMAREGI_HEADERS = [
  "商品ID",
  "部門ID",
  "商品コード",
  "商品名",
  "原価",
  "商品単価",
  "免税区分",
];

export function decodeOchanokoCsv(input: Uint8Array) {
  const buffer = Buffer.from(input);
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  )
    return buffer.subarray(3).toString("utf8");
  const utf8 = buffer.toString("utf8");
  return utf8.includes("\uFFFD") ? iconv.decode(buffer, "cp932") : utf8;
}

export function convertOchanokoRowsToSmaregi(
  text: string,
  departmentId: string,
) {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ""));
  const headers = rows[0] || [];
  const indexes = {
    name: headers.indexOf("商品名"),
    code: headers.indexOf("型番/品番"),
    price: headers.indexOf("販売価格"),
  };
  if (indexes.name < 0 || indexes.code < 0)
    throw new Error(
      "おちゃのこ商品CSVではありません（商品名または型番/品番列がありません）",
    );
  const normalizedDepartmentId = departmentId.trim();
  if (!normalizedDepartmentId) throw new Error("部門IDを入力してください");

  const converted: string[][] = [];
  let skipped = 0;
  for (const row of rows.slice(1)) {
    if (row.every((cell) => !cell.trim())) continue;
    const productName = (row[indexes.name] || "").trim();
    const productCode = (row[indexes.code] || "").trim();
    if (!productName || !productCode) {
      skipped += 1;
      continue;
    }
    converted.push([
      "",
      normalizedDepartmentId,
      productCode,
      productName,
      "",
      indexes.price >= 0 ? (row[indexes.price] || "").trim() : "",
      "0",
    ]);
  }
  if (!converted.length)
    throw new Error("変換できるワンピース商品がありません");
  return { rows: converted, skipped };
}

export function buildSmaregiCsv(rows: string[][]) {
  return [csvLine(SMAREGI_HEADERS), ...rows.map(csvLine)].join("\r\n") + "\r\n";
}
