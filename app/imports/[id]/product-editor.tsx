"use client";

import { useState } from "react";

export interface EditableProduct { id: string | null; sourceKey: string; cardNumber: string; cardName: string; rarity: string | null; colors: string[]; isParallel: boolean; imageUrl: string | null; productCode: string; productName: string; salePrice: number | null; costPrice: number | null; initialStock: number; departmentId: string; category: string; exportEnabled: boolean }

export function ProductEditor({ initialProducts }: { initialProducts: EditableProduct[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const shown = products.filter((product) => `${product.cardNumber} ${product.cardName} ${product.productName}`.toLowerCase().includes(filter.toLowerCase()));
  const invalidCount = products.filter((product) => product.exportEnabled && (product.salePrice === null || !product.departmentId || !product.category || !product.productCode)).length;

  function update(sourceKey: string, field: keyof EditableProduct, value: string | number | boolean | null) { setProducts((current) => current.map((product) => product.sourceKey === sourceKey ? { ...product, [field]: value } : product)); }
  async function save(product: EditableProduct) {
    if (!product.id) { setMessage("この商品は重複取込のため既存商品を参照しています。先に元の取込を編集してください。"); return; }
    setMessage(`${product.cardNumber}を保存しています…`);
    const response = await fetch(`/api/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product) });
    const result = await response.json(); setMessage(response.ok ? `${product.cardNumber}を保存しました。` : result.error || "保存に失敗しました");
  }
  function bulk(field: "salePrice" | "costPrice" | "initialStock" | "departmentId" | "category", value: string) {
    setProducts((current) => current.map((product) => ({ ...product, [field]: field === "departmentId" || field === "category" ? value : value === "" ? null : Number(value) })));
  }

  return <><div className="editorToolbar"><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="カード名・型番で検索"/><span className={invalidCount ? "validationBad" : "validationGood"}>{invalidCount ? `未入力 ${invalidCount}件` : "出力必須項目 OK"}</span></div><details className="bulkPanel"><summary>一括編集</summary><div className="bulkGrid"><label>販売価格<input type="number" min="0" onChange={(e)=>bulk("salePrice",e.target.value)}/></label><label>原価<input type="number" min="0" onChange={(e)=>bulk("costPrice",e.target.value)}/></label><label>在庫<input type="number" min="0" onChange={(e)=>bulk("initialStock",e.target.value)}/></label><label>部門ID<input onChange={(e)=>bulk("departmentId",e.target.value)}/></label><label>カテゴリ<input onChange={(e)=>bulk("category",e.target.value)}/></label></div><p>一括編集後、各商品の保存ボタンを押してください。</p></details>{message && <div className="notice editorMessage">{message}</div>}<div className="productCards">{shown.map((product)=><article className="productCard" key={product.sourceKey}><div className="productImage">{product.imageUrl ? <img src={product.imageUrl} alt={product.cardName}/> : <span>画像なし</span>}</div><div className="productFields"><div className="cardMeta"><b>{product.cardNumber}</b><span>{product.rarity}</span>{product.isParallel && <span>パラレル</span>}<span>{product.colors.join("・")}</span></div><div className="field"><label>商品名</label><input value={product.productName} onChange={(e)=>update(product.sourceKey,"productName",e.target.value)}/></div><div className="field"><label>商品コード</label><input value={product.productCode} onChange={(e)=>update(product.sourceKey,"productCode",e.target.value)}/></div><div className="smallFields"><div className="field"><label>販売価格</label><input type="number" min="0" value={product.salePrice ?? ""} onChange={(e)=>update(product.sourceKey,"salePrice",e.target.value===""?null:Number(e.target.value))}/></div><div className="field"><label>原価</label><input type="number" min="0" value={product.costPrice ?? ""} onChange={(e)=>update(product.sourceKey,"costPrice",e.target.value===""?null:Number(e.target.value))}/></div><div className="field"><label>在庫</label><input type="number" min="0" value={product.initialStock} onChange={(e)=>update(product.sourceKey,"initialStock",Number(e.target.value))}/></div><div className="field"><label>部門ID</label><input value={product.departmentId} onChange={(e)=>update(product.sourceKey,"departmentId",e.target.value)}/></div></div><div className="field"><label>おちゃのこカテゴリ</label><input value={product.category} onChange={(e)=>update(product.sourceKey,"category",e.target.value)}/></div><div className="productActions"><label><input type="checkbox" checked={product.exportEnabled} onChange={(e)=>update(product.sourceKey,"exportEnabled",e.target.checked)}/> 出力対象</label><button className="button" onClick={()=>save(product)}>保存</button></div></div></article>)}</div></>;
}
