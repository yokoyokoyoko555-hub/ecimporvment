import type { PoolClient } from "pg";

export function onePieceBaseCode(cardNumber: string) {
  const normalized = cardNumber.trim().toUpperCase();
  if (!/^[A-Z]{1,5}[0-9]{0,2}-[0-9]{3}$/.test(normalized)) {
    throw new Error("ワンピースの型番を「OP01-001」「ST01-001」「P-001」の形式で入力してください");
  }
  return normalized.replace("-", "");
}

async function isReserved(client: PoolClient, productCode: string) {
  const result = await client.query(`SELECT 1 FROM legacy_product_codes WHERE product_code=$1
    UNION ALL SELECT 1 FROM products WHERE product_code=$1 LIMIT 1`, [productCode]);
  return result.rowCount !== null && result.rowCount > 0;
}

export async function resolveProductCode(client: PoolClient, titleKey: string, cardNumber: string, requestedCode?: string | null) {
  const requested = requestedCode?.trim();
  if (requested) {
    if (await isReserved(client, requested)) throw new Error(`商品コード「${requested}」は既存商品で使用されています`);
    return requested;
  }
  if (titleKey !== "onepiece") throw new Error("商品コードを入力してください");

  const baseCode = onePieceBaseCode(cardNumber);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const sequence = await client.query<{ last_branch: number }>(`INSERT INTO product_code_sequences(title_key,base_code,last_branch)
      VALUES('onepiece',$1,1)
      ON CONFLICT(title_key,base_code) DO UPDATE SET last_branch=product_code_sequences.last_branch+1,updated_at=now()
      RETURNING last_branch`, [baseCode]);
    const candidate = `${baseCode}-${String(sequence.rows[0].last_branch).padStart(2, "0")}`;
    if (!(await isReserved(client, candidate))) return candidate;
  }
  throw new Error(`${cardNumber}の商品コードを採番できませんでした`);
}
