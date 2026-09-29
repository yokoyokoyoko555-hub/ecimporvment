export const csvCell = (value: unknown) => {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const csvLine = (values: unknown[]) => values.map(csvCell).join(",");

export function ochanokoHeaders() {
  const headers = [
    "商品番号", "商品名", "カテゴリ", "サブカテゴリ", "型番/品番", "JANコード", "グループ",
    "販売価格", "希望小売価格", "全体割引除外", "商品毎の追加ポイント", "ポイント発行除外",
    "ポイント利用除外", "軽減税率", "オーダーメイドパターン", "在庫数",
    "在庫が0でも注文を受け付ける", "在庫切れテキスト", "SOLD OUT画像テキスト",
    "在庫わずか表示ライン", "在庫単位", "在庫単位を表示しない", "数量ラベル：ラベル",
    "数量ラベル：単位", "一度に購入できる商品点数", "バリエーションも商品単位で制限する",
    "再入荷お知らせメール", "用途除外", "オプション除外", "送料", "送料：個別設定",
    "送料：単独設定", "同梱送料無料", "重量別適用時の重さ", "送料オプション1",
    "送料オプション1追加金額", "送料オプション2", "送料オプション2追加金額",
    "送料オプション3", "送料オプション3追加金額", "期間限定販売", "期間限定販売：開始",
    "期間限定販売：終了", "メイン写真", "メイン写真タイトル",
  ];

  for (let index = 1; index <= 49; index += 1) {
    headers.push(`サブ写真${index}`, `サブ写真タイトル${index}`);
  }

  headers.push(
    "メイン写真リンクURL", "説明", "説明：改行をBRタグに置換", "説明：URLをリンクタグに置換",
    "YouTube", "SEO：タイトル", "SEO：ディスクリプション", "SEO：キーワード",
    "SEO：キャッチフレーズ", "SEO：ヘッダー", "公開状態", "新着商品", "おすすめ商品",
    "カートに入れられないようにする", "商品仕様：項目名", "商品仕様：内容",
  );

  for (let index = 1; index <= 3; index += 1) {
    headers.push(
      `他の写真${index}`,
      `他の写真${index} 説明`,
      `他の写真${index} 説明：改行をBRタグに置換`,
      `他の写真${index} 説明：URLをリンクタグに置換`,
    );
  }

  headers.push(
    "外部ショッピング：condition", "外部ショッピング：product_type", "外部ショッピング：gtin",
    "外部ショッピング：brand", "外部ショッピング：mpn", "バリエーション選択形式",
    "項目名を縦と横に並べない",
  );
  for (let index = 1; index <= 10; index += 1) headers.push(`関連商品${index}`);
  headers.push("ランキング表示", "お支払い方法除外", "発送方法除外", "商品削除", "管理用メモ");
  return headers;
}
