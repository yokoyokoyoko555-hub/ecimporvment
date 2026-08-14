import Link from "next/link";
import { ImportForm } from "./import-form";

export default function NewImportPage(){return <><header className="topline"><div><div className="eyebrow">New import</div><h1>新規取込</h1><p className="subtitle">公式サイトから取得するか、少数のカードを手動で登録できます。</p></div><Link className="button secondary" href="/imports/manual">手動でカードを登録</Link></header><div className="grid2"><section className="card"><ImportForm /></section><aside className="card"><h3>少数カードは手動登録</h3><p className="subtitle">スクレイピング元がないカードや、数件だけ追加したい場合は手動登録を使います。登録後は通常の取込と同じ画面で確認・編集・CSV出力できます。</p><p><Link className="button secondary" href="/imports/manual">手動登録を開く</Link></p></aside></div></>}
