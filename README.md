# ecimporvment

トレーディングカード商品登録支援システム。メーカー公式サイトから新商品のカード情報・画像を取得し、画面で確認・編集して、おちゃのこネット商品CSV・スマレジ商品CSV・商品画像ZIPを出力する。詳しい設計は [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md)。

## 使い方

`npm install` → `npm run db:migrate` → `npm run dev`（Next.js）。テストは `npm test`、型チェックは `npm run typecheck`。

## 作り方・技術メモ

- Next.js 15 / React 19 / PostgreSQL（pg）/ cheerio（スクレイピング）/ iconv-lite（CSV文字コード）/ jszip（画像ZIP）。
- メーカーごとの差異は「取得アダプター」で吸収し、共通の商品マスターへ正規化してからCSVを生成する。
