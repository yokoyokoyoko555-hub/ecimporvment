export type LegacyCodeRecord = { productName: string; productCode: string };

export type LegacyOchanokoProduct = {
  productNumber: string;
  productName: string;
  productCode: string;
  category: string;
  subcategory: string;
  groupName: string;
  salePrice: number | null;
  initialStock: number | null;
  publicationStatus: string;
  isDamaged: boolean;
  rawData: Record<string, string>;
};

export function parseCsvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

export function extractLegacyCodes(text: string) {
  const rows = parseCsvRows(text);
  const header = rows[0] || [];
  const nameIndex = header.indexOf("商品名");
  const codeIndex = header.indexOf("型番/品番");
  if (nameIndex < 0 || codeIndex < 0) throw new Error("おちゃのこ商品CSVではありません（商品名または型番/品番列がありません）");
  const records: LegacyCodeRecord[] = [];
  for (const row of rows.slice(1)) {
    const productCode = (row[codeIndex] || "").trim();
    if (!productCode) continue;
    if (productCode.length > 100 || !/^[A-Za-z0-9_-]+$/.test(productCode)) continue;
    records.push({ productName: (row[nameIndex] || "").trim(), productCode });
  }
  return records;
}

const integerOrNull = (value: string | undefined) => {
  const normalized = (value || "").replace(/,/g, "").trim();
  if (!normalized || !/^-?\d+$/.test(normalized)) return null;
  return Number(normalized);
};

export function extractLegacyOchanokoProducts(text: string) {
  const rows = parseCsvRows(text);
  const header = rows[0] || [];
  const required = ["商品番号", "商品名", "型番/品番"];
  if (required.some((name) => !header.includes(name))) {
    throw new Error("おちゃのこ商品CSVではありません（商品番号・商品名・型番/品番列を確認してください）");
  }
  const index = (name: string) => header.indexOf(name);
  const products: LegacyOchanokoProduct[] = [];
  let skippedWithoutNumber = 0;
  for (const row of rows.slice(1)) {
    const productNumber = (row[index("商品番号")] || "").trim();
    const productName = (row[index("商品名")] || "").trim();
    if (!productNumber) {
      if (productName) skippedWithoutNumber += 1;
      continue;
    }
    if (!productName) continue;
    const rawData = Object.fromEntries(
      header.map((name, position) => [name, row[position] || ""]),
    );
    const productCode = (row[index("型番/品番")] || "").trim();
    products.push({
      productNumber,
      productName,
      productCode,
      category: (row[index("カテゴリ")] || "").trim(),
      subcategory: (row[index("サブカテゴリ")] || "").trim(),
      groupName: (row[index("グループ")] || "").trim(),
      salePrice: integerOrNull(row[index("販売価格")]),
      initialStock: integerOrNull(row[index("在庫数")]),
      publicationStatus: (row[index("公開状態")] || "").trim(),
      isDamaged:
        productName.startsWith("【傷あり特価】") ||
        productCode.toLowerCase().endsWith("dmg"),
      rawData,
    });
  }
  return { products, skippedWithoutNumber };
}

export function collectOnePieceSequences(records: LegacyCodeRecord[]) {
  const sequences = new Map<string, number>();
  for (const record of records) {
    const cardNumbers = record.productName.match(/[A-Z]{1,5}[0-9]{0,2}-[0-9]{3}/g) || [];
    for (const cardNumber of cardNumbers) {
      const baseCode = cardNumber.replace("-", "");
      const match = record.productCode.match(new RegExp(`^${baseCode}-(\\d{2})(?:dmg)?$`));
      if (!match) continue;
      sequences.set(baseCode, Math.max(sequences.get(baseCode) || 0, Number(match[1])));
      break;
    }
  }
  return sequences;
}
