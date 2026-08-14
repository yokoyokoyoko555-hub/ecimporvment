import Link from "next/link";
import "./guide.css";

const steps = [
  ["カード情報を取り込む", "「取込」から新規取込を開き、メーカー公式サイトから取得します。少数カードや取得元がないカードは「手動登録」から1件ずつ入力できます。"],
  ["取得結果を確認する", "通常版とパラレル版、カード番号、名称、レアリティ、色、画像などの取得内容を確認します。"],
  ["販売情報を編集する", "「商品」で商品名、商品コード、販売価格、原価、初期在庫、カテゴリ、スマレジ部門IDを編集します。"],
  ["エラーを解消する", "商品コードの重複、価格やカテゴリの未入力、画像取得失敗などを確認します。"],
  ["画像を登録する", "「出力」で画像ZIPと対応表をダウンロードし、画像をおちゃのこネットへ一括アップロードします。"],
  ["CSVを出力する", "おちゃのこネット用CSVとスマレジ用CSVを生成します。両方に共通の商品コードが設定されます。"],
];

export default function GuidePage() {
  return <><header className="topline"><div><div className="eyebrow">Guide</div><h1>使い方</h1><p className="subtitle">カード情報の取込から商品CSV出力までの基本的な流れです。</p></div><Link className="button" href="/imports/new">取込を始める</Link></header><div className="grid2"><section className="card"><div className="guideSteps">{steps.map(([title, text], index) => <div className="guideStep" key={title}><span className="stepNumber">{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></section><aside><section className="card"><h3>メニューの役割</h3><div className="guideNote"><h3>ダッシュボード</h3><p>取込件数、カード数、確認待ち、出力可能な商品の状況を確認します。</p></div><div className="guideNote"><h3>設定</h3><p>商品コード、商品名、カテゴリ、部門、商品説明などの自動生成規則を管理します。</p></div><div className="guideNote"><h3>困ったとき</h3><p>処理に失敗した場合は、対象の取込に表示されるエラー内容を確認して再実行します。</p></div></section></aside></div></>;
}
