import Link from "next/link";
import { pool } from "@/lib/db";
import { ImportForm, type ImportSource } from "./import-form";

export const dynamic = "force-dynamic";

export default async function NewImportPage() {
  let sources: ImportSource[] = [];
  if (pool) {
    const result = await pool.query<{
      title_key: string;
      display_name: string;
      source_name: string;
      scraper_key:
        | "digimon"
        | "onepiece"
        | "lorcana"
        | "xross-stars"
        | "harrypotter";
      default_url: string;
    }>(`SELECT s.title_key,t.display_name,s.source_name,s.scraper_key,s.default_url
      FROM catalog_sources s JOIN product_name_templates t ON t.title_key=s.title_key
      WHERE s.active=true AND s.acquisition_method='scraping' AND s.scraper_key IS NOT NULL ORDER BY t.created_at`);
    sources = result.rows.map((row) => ({
      titleKey: row.title_key,
      displayName: row.display_name,
      sourceName: row.source_name,
      scraperKey: row.scraper_key,
      defaultUrl: row.default_url,
    }));
  }
  return (
    <>
      <header className="topline">
        <div>
          <div className="eyebrow">New import</div>
          <h1>新規取込</h1>
          <p className="subtitle">
            公式サイトから取得するか、少数のカードを手動で登録できます。
          </p>
        </div>
        <Link className="button secondary" href="/imports/manual">
          手動でカードを登録
        </Link>
      </header>
      <div className="grid2">
        <section className="card">
          <ImportForm sources={sources} />
        </section>
        <aside className="card">
          <h3>取得元とタイトルの変更</h3>
          <p className="subtitle">
            「設定 →
            取扱タイトル・取得元管理」で、取扱状態・取得方法・標準URLを変更できます。スクレイピング未対応サイトのカードは手動登録を使用します。
          </p>
          <p>
            <Link className="button secondary" href="/settings">
              取得元設定を開く
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
