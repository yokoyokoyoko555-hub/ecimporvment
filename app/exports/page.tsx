import Link from "next/link";
import { listBatches } from "@/lib/repository";
import { pool } from "@/lib/db";
import { DownloadButton } from "./download-button";
import "./exports.css";
import "./export-status.css";

export const dynamic = "force-dynamic";
type Status = {
  total: string;
  missing_price: string;
  missing_department: string;
  missing_category: string;
  missing_code: string;
  missing_image: string;
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ batch?: string }>;
}) {
  const query = await searchParams;
  const batches = await listBatches();
  const id = query.batch || batches[0]?.id;
  let status: Status = {
    total: "0",
    missing_price: "0",
    missing_department: "0",
    missing_category: "0",
    missing_code: "0",
    missing_image: "0",
  };
  if (id && pool) {
    const result = await pool.query<Status>(
      `SELECT count(*)::text total,
      count(*) FILTER(WHERE p.sale_price IS NULL)::text missing_price,
      count(*) FILTER(WHERE p.department_id IS NULL OR trim(p.department_id)='')::text missing_department,
      count(*) FILTER(WHERE p.category IS NULL OR trim(p.category)='')::text missing_category,
      count(*) FILTER(WHERE p.product_code IS NULL OR trim(p.product_code)='')::text missing_code,
      count(*) FILTER(WHERE c.source_image_url IS NULL OR trim(c.source_image_url)='')::text missing_image
      FROM cards c JOIN products p ON p.card_id=c.id WHERE c.import_batch_id=$1 AND p.export_enabled=true`,
      [id],
    );
    status = result.rows[0] || status;
  }
  const department = Number(status.missing_department),
    category = Number(status.missing_category),
    code = Number(status.missing_code),
    missingImage = Number(status.missing_image);
  const ochanokoReason =
    code || category
      ? `未入力があります：商品コード ${code}件・カテゴリ ${category}件`
      : null;
  const smaregiReason =
    code || department
      ? `未入力があります：商品コード ${code}件・部門ID ${department}件`
      : null;
  const cards = [
    {
      title: "おちゃのこネットCSV",
      type: "ochanoko",
      description: "204列・CP932形式（販売価格・在庫・部門IDは空欄可）",
      reason: ochanokoReason,
    },
    {
      title: "スマレジCSV",
      type: "smaregi",
      description: "7列・CP932形式（部門ID必須）",
      reason: smaregiReason,
    },
    {
      title: "商品画像ZIP",
      type: "images",
      description: `画像と対応表（画像なし ${missingImage}件）`,
      reason: null,
    },
  ];
  return (
    <>
      <header className="topline">
        <div>
          <div className="eyebrow">Exports</div>
          <h1>出力管理</h1>
          <p className="subtitle">
            編集済みの商品からCSVと画像ZIPを生成します。
          </p>
        </div>
      </header>
      <section className="panel">
        <div className="panelHeader">
          <h2>対象セット</h2>
        </div>
        <div className="exportBody">
          <form>
            <select name="batch" defaultValue={id}>
              {batches.map((batch) => (
                <option value={batch.id} key={batch.id}>
                  {batch.set_name}（{batch.card_count}件）
                </option>
              ))}
            </select>
            <button className="button secondary">変更</button>
          </form>
          {id ? (
            <>
              <div className="exportSummary">
                <b>出力対象 {Number(status.total).toLocaleString()}件</b>
                {(ochanokoReason || smaregiReason) && (
                  <span>未入力項目があるCSVは、商品編集後に出力できます。</span>
                )}
                <Link href={`/imports/${id}`}>商品を確認・編集</Link>
              </div>
              <div className="exportGrid">
                {cards.map((card) => (
                  <div className="card" key={card.type}>
                    <h3>{card.title}</h3>
                    <p className="subtitle">{card.description}</p>
                    {card.reason && (
                      <p className="exportWarning">{card.reason}</p>
                    )}
                    <DownloadButton
                      batchId={id}
                      type={card.type}
                      disabledReason={card.reason}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty">取込データがありません。</div>
          )}
        </div>
      </section>
    </>
  );
}
