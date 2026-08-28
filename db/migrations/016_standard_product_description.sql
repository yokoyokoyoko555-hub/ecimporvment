-- 既定の簡易テンプレートだけを標準の商品説明へ更新する。
-- 運用画面で編集済みのテンプレートは上書きしない。
UPDATE product_description_templates
SET template_text = $template$<div class='product-info'>
  <div class='product-heading bold'>商品詳細</div>
  <div class='product-heading-line'></div>
  <div class='product-detail'>
  コチラの商品は店頭との併売商品となっております。<br />
  入金確認後に商品をご確保する関係上、ご用意できない可能性がございます。<br />
  その場合の代金は全額ご返金させていただきます。<br />
  ご了承ください。<br /><br />
  {{set_name}}<br />
  {{product_name}}<br />
  特徴:{{traits}}
  </div>
  <div class='product-heading bold'>状態に関して</div>
  <div class='product-heading-line'></div>
  <div class='product-detail'>
  この商品の状態は<span class='product-attention-text font-red'>A</span>になります。<br />
  状態表記に関しては<a href='https://torecabinks.ocnk.net/page/1' class='product-attention-text' target='_blank'>コチラ</a>をご確認ください。
  </div>
  <div class='product-heading bold'>発送方法・送料に関して</div>
  <div class='product-heading-line'></div>
  <div class='product-detail'>
  ゆうパケットで発送の場合は<span class='product-attention-text font-red'>一律250円</span>になります。<br />
  <span class='product-attention-text font-red'>10,000円以上購入で送料無料</span><br />
  発送方法・送料に関しては<a href='https://torecabinks.ocnk.net/help#help_charge' class='product-attention-text' target='_blank'>コチラ</a>をご確認ください。<br />
  入金確認から<span class='product-attention-text font-red'>24時間</span>以内に発送いたします。
  </div>
</div>$template$,
    updated_at = now()
WHERE template_text = '{{product_name}}<br />収録：{{set_name}}<br />型番：{{card_number}}';
