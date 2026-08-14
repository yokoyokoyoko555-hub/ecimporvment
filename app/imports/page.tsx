import Link from "next/link";
import { listBatches } from "@/lib/repository";

export const dynamic = "force-dynamic";

export default async function ImportsPage(){const batches=await listBatches();return <><header className="topline"><div><div className="eyebrow">Imports</div><h1>取込管理</h1><p className="subtitle">商品セットをクリックすると、取得したカードを確認・編集できます。</p></div><div className="headerActions"><Link className="button secondary" href="/imports/manual">＋ 手動登録</Link><Link className="button" href="/imports/new">＋ 新規取込</Link></div></header><section className="panel"><table className="table"><thead><tr><th>セット</th><th>取得方法</th><th>件数</th><th>状態</th><th></th></tr></thead><tbody>{batches.map(b=><tr key={b.id}><td><Link className="tableLink" href={`/imports/${b.id}`}><b>{b.set_name}</b></Link><br/><small>{b.set_code}</small></td><td className="urlCell">{b.source_url === "manual://entry" ? "手動登録" : b.source_url}</td><td>{b.card_count}</td><td><span className="badge">{b.status}</span></td><td><Link className="button secondary" href={`/imports/${b.id}`}>確認・編集</Link></td></tr>)}</tbody></table></section></>}
