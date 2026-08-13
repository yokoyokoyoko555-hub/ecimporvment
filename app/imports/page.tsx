import Link from "next/link";
import { listBatches } from "@/lib/repository";

export default async function ImportsPage(){const batches=await listBatches();return <><header className="topline"><div><div className="eyebrow">Imports</div><h1>取込管理</h1><p className="subtitle">メーカーサイトごとの取得状況を管理します。</p></div><Link className="button" href="/imports/new">＋ 新規取込</Link></header><section className="panel"><table className="table"><thead><tr><th>セット</th><th>取得元URL</th><th>件数</th><th>状態</th></tr></thead><tbody>{batches.map(b=><tr key={b.id}><td><b>{b.set_name}</b><br/><small>{b.set_code}</small></td><td>{b.source_url}</td><td>{b.card_count}</td><td><span className="badge">{b.status}</span></td></tr>)}</tbody></table></section></>}
