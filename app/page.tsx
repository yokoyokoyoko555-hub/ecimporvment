import Link from "next/link";
import { dashboardCounts, listBatches } from "@/lib/repository";
import { hasDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

const labels: Record<string, string> = { needs_review: "要確認", ready: "出力可能", draft: "下書き", fetching: "取得中", failed: "失敗", exported: "出力済み" };

export default async function Dashboard() {
  const [counts, batches] = await Promise.all([dashboardCounts(), listBatches()]);
  return <><header className="topline"><div><div className="eyebrow">Overview</div><h1>商品登録ダッシュボード</h1><p className="subtitle">カード取得から2種類のCSV出力までを一か所で管理します。</p></div><Link className="button" href="/imports/new">＋ 新規取込</Link></header>
    {!hasDatabase && <div className="notice" style={{marginBottom:18}}>現在はプレビューモードです。RailwayにPostgreSQLを追加し、DATABASE_URLを設定すると実データへ切り替わります。</div>}
    <section className="stats"><div className="card stat"><span>取込バッチ</span><b>{counts.batches}</b></div><div className="card stat"><span>取得カード</span><b>{counts.cards}</b></div><div className="card stat"><span>要確認</span><b>{counts.needsReview}</b></div><div className="card stat"><span>出力可能</span><b>{counts.ready}</b></div></section>
    <section className="panel"><div className="panelHeader"><h2>最近の取込</h2><Link className="button secondary" href="/imports">すべて見る</Link></div><table className="table"><thead><tr><th>商品セット</th><th>コード</th><th>カード数</th><th>状態</th></tr></thead><tbody>{batches.map((batch)=><tr key={batch.id}><td>{batch.set_name}</td><td>{batch.set_code ?? "—"}</td><td>{batch.card_count}</td><td><span className="badge">{labels[batch.status]}</span></td></tr>)}</tbody></table></section>
  </>;
}
