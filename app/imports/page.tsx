import Link from "next/link";
import { listBatches } from "@/lib/repository";
import "./imports.css";

export const dynamic = "force-dynamic";

export default async function ImportsPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const batches = await listBatches(500);
  const selectedTitle = (await searchParams).title || "all";
  const titles = Array.from(
    batches.reduce((map, batch) => {
      const current = map.get(batch.title_key);
      map.set(batch.title_key, {
        key: batch.title_key,
        name: batch.title_name,
        count: (current?.count || 0) + 1,
      });
      return map;
    }, new Map<string, { key: string; name: string; count: number }>()),
  ).map(([, title]) => title);
  const visibleBatches =
    selectedTitle === "all"
      ? batches
      : batches.filter((batch) => batch.title_key === selectedTitle);

  return (
    <>
      <header className="topline">
        <div>
          <div className="eyebrow">Imports</div>
          <h1>取込管理</h1>
          <p className="subtitle">
            商品セットをクリックすると、取得したカードを確認・編集できます。
          </p>
        </div>
        <div className="headerActions">
          <Link className="button secondary" href="/imports/manual">
            ＋ 手動登録
          </Link>
          <Link className="button" href="/imports/new">
            ＋ 新規取込
          </Link>
        </div>
      </header>

      <nav className="importTitleTabs" aria-label="タイトルで絞り込み">
        <Link href="/imports" className={selectedTitle === "all" ? "active" : ""}>
          すべて <span>{batches.length}</span>
        </Link>
        {titles.map((title) => (
          <Link
            href={`/imports?title=${encodeURIComponent(title.key)}`}
            className={selectedTitle === title.key ? "active" : ""}
            key={title.key}
          >
            {title.name} <span>{title.count}</span>
          </Link>
        ))}
      </nav>

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>セット</th>
              <th>取得方法</th>
              <th>件数</th>
              <th>状態</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleBatches.map((batch) => (
              <tr key={batch.id}>
                <td>
                  <Link className="tableLink" href={`/imports/${batch.id}`}>
                    <b>{batch.set_name}</b>
                  </Link>
                  <br />
                  <small>{batch.set_code}</small>
                </td>
                <td className="urlCell">
                  {batch.source_url === "manual://entry" ? "手動登録" : batch.source_url}
                </td>
                <td>{batch.card_count}</td>
                <td>
                  <span className="badge">{batch.status}</span>
                </td>
                <td>
                  <Link className="button secondary" href={`/imports/${batch.id}`}>
                    確認・編集
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleBatches.length && <div className="empty">このタイトルの取込はありません。</div>}
      </section>
    </>
  );
}
