"use client";

import { useState } from "react";

export interface EditableProduct { id: string | null; sourceKey: string; cardNumber: string; cardName: string; rarity: string | null; colors: string[]; isParallel: boolean; imageUrl: string | null; productCode: string; productName: string; salePrice: number | null; costPrice: number | null; initialStock: number; departmentId: string; category: string; exportEnabled: boolean; isDamaged: boolean; createDamaged: boolean }

export function ProductEditor({ initialProducts, batchId }: { initialProducts: EditableProduct[]; batchId: string }) {
  const [products, setProducts] = useState(initialProducts);
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const shown = products.filter((product) => `${product.cardNumber} ${product.cardName} ${product.productName}`.toLowerCase().includes(filter.toLowerCase()));
  const invalid = products.filter((product) => product.exportEnabled && (product.salePrice === null || !product.departmentId || !product.category || !product.productCode)).length;

  function update(key: string, field: keyof EditableProduct, value: string | number | boolean | null) {
    setProducts((current) => current.map((product) => product.sourceKey === key ? { ...product, [field]: value } : product));
  }

  function bulk(field: "salePrice" | "costPrice" | "initialStock" | "departmentId" | "category", value: string) {
    setProducts((current) => current.map((product) => ({ ...product, [field]: field === "departmentId" || field === "category" ? value : value === "" ? null : Number(value) })));
  }

  async function saveAll() {
    const targets = products.filter((product): product is EditableProduct & { id: string } => Boolean(product.id));
    setSaving(true); setMessage(`${targets.length}件を保存しています…`);
    try {
      const response = await fetch("/api/products/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ batchId, products: targets }) });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "保存失敗"); return; }
      if (result.createdDamaged > 0) {
        setMessage(`保存し、傷あり商品を${result.createdDamaged}件作成しました。`);
        window.location.reload();
        return;
      }
      setMessage(`${targets.length}件を保存しました。未入力 ${result.missing}件です。`);
    } finally { setSaving(false); }
  }

  return <>
    <div className="editorToolbar"><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="カード名・型番で検索" /><span className={invalid ? "validationBad" : "validationGood"}>{invalid ? `未入力 ${invalid}件` : "出力必須項目 OK"}</span><button className="button" disabled={saving} onClick={saveAll}>{saving ? "保存中…" : "すべて保存"}</button></div>
    <details className="bulkPanel"><summary>一括編集</summary><div className="bulkGrid"><label>販売価格<input type="number" min="0" onChange={(event) => bulk("salePrice", event.target.value)} /></label><label>原価<input type="number" min="0" onChange={(event) => bulk("costPrice", event.target.value)} /></label><label>在庫<input type="number" min="0" onChange={(event) => bulk("initialStock", event.target.value)} /></label><label>部門ID<input onChange={(event) => bulk("departmentId", event.target.value)} /></label><label>カテゴリ<input onChange={(event) => bulk("category", event.target.value)} /></label></div><p>入力後、上部の「すべて保存」を押してください。</p></details>
    {message && <div className="notice editorMessage">{message}</div>}
    <div className="productCards">{shown.map((product) => <article className={`productCard${product.isDamaged ? " damagedProduct" : ""}`} key={product.sourceKey}>
      <div className="productImage">{product.imageUrl ? <img src={product.imageUrl} alt={product.cardName} /> : <span>画像なし</span>}</div>
      <div className="productFields"><div className="cardMeta"><b>{product.cardNumber}</b><span>{product.rarity}</span>{product.isParallel && <span>パラレル</span>}{product.isDamaged && <span className="damagedBadge">状態A-</span>}<span>{product.colors.join("・")}</span></div>
        <div className="field"><label>商品名</label><input value={product.productName} onChange={(event) => update(product.sourceKey, "productName", event.target.value)} /></div>
        <div className="field"><label>商品コード</label><input value={product.productCode} onChange={(event) => update(product.sourceKey, "productCode", event.target.value)} /></div>
        <div className="smallFields"><div className="field"><label>販売価格</label><input type="number" min="0" value={product.salePrice ?? ""} onChange={(event) => update(product.sourceKey, "salePrice", event.target.value === "" ? null : Number(event.target.value))} /></div><div className="field"><label>原価</label><input type="number" min="0" value={product.costPrice ?? ""} onChange={(event) => update(product.sourceKey, "costPrice", event.target.value === "" ? null : Number(event.target.value))} /></div><div className="field"><label>在庫</label><input type="number" min="0" value={product.initialStock} onChange={(event) => update(product.sourceKey, "initialStock", Number(event.target.value))} /></div><div className="field"><label>部門ID</label><input value={product.departmentId} onChange={(event) => update(product.sourceKey, "departmentId", event.target.value)} /></div></div>
        <div className="field"><label>おちゃのこカテゴリ</label><input value={product.category} onChange={(event) => update(product.sourceKey, "category", event.target.value)} /></div>
        <div className="productActions"><label><input type="checkbox" checked={product.exportEnabled} onChange={(event) => update(product.sourceKey, "exportEnabled", event.target.checked)} /> 出力対象</label>{!product.isDamaged && <label className="createDamaged"><input type="checkbox" checked={product.createDamaged} onChange={(event) => update(product.sourceKey, "createDamaged", event.target.checked)} /> 傷あり商品も作成</label>}</div>
      </div>
    </article>)}</div>
  </>;
}
