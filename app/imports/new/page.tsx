import { ImportForm } from "./import-form";

export default function NewImportPage(){return <><header className="topline"><div><div className="eyebrow">New import</div><h1>新規取込</h1><p className="subtitle">最初の対応元はデジモンカード公式です。</p></div></header><div className="grid2"><section className="card"><ImportForm /></section><aside className="card"><h3>取込後の流れ</h3><p className="subtitle">カード情報を取得後、販売価格・在庫・カテゴリ・部門を一覧で編集します。エラーがなくなるとCSVと画像ZIPを生成できます。</p></aside></div></>}
