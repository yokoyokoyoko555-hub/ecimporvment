"use client";

import { useState } from "react";

export type ExistingProductItem = {
  id: string;
  productNumber: string;
  productCode: string;
  productName: string;
  category: string;
  subcategory: string;
  groupName: string;
  salePrice: number | null;
  initialStock: number | null;
  publicationStatus: string;
  isDamaged: boolean;
};

export function ExistingProductRow({ initial }: { initial: ExistingProductItem }) {
  const [item, setItem] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const set = <K extends keyof ExistingProductItem>(key: K, value: ExistingProductItem[K]) =>
    setItem((current) => ({ ...current, [key]: value }));

  async function save() {
    setBusy(true);
    setMessage("保存中…");
    try {
      const response = await fetch(`/api/existing-products/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存に失敗しました");
      setMessage("保存しました");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  async function damage() {
    if (!confirm(`商品番号 ${item.productNumber} を傷あり商品へ変更しますか？`)) return;
    setBusy(true);
    setMessage("傷ありへ変更中…");
    try {
      const response = await fetch(`/api/existing-products/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "damage" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "変更に失敗しました");
      setItem((current) => ({
        ...current,
        productName: result.productName || current.productName,
        productCode: result.productCode || current.productCode,
        groupName: result.groupName || current.groupName,
        isDamaged: true,
      }));
      setMessage("傷あり商品へ変更しました");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "変更に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={`existingProductCard${item.isDamaged ? " damaged" : ""}`}>
      <div className="existingProductMeta">
        <b>商品番号 {item.productNumber}</b>
        {item.isDamaged && <span className="badge">状態A-</span>}
      </div>
      <div className="existingProductGrid">
        <label className="wide">商品名<input value={item.productName} onChange={(event) => set("productName", event.target.value)} /></label>
        <label>型番/品番<input value={item.productCode} onChange={(event) => set("productCode", event.target.value)} /></label>
        <label>販売価格<input type="number" min="0" value={item.salePrice ?? ""} onChange={(event) => set("salePrice", event.target.value === "" ? null : Number(event.target.value))} /></label>
        <label>在庫数<input type="number" min="0" value={item.initialStock ?? ""} onChange={(event) => set("initialStock", event.target.value === "" ? null : Number(event.target.value))} /></label>
        <label>公開状態<input value={item.publicationStatus} onChange={(event) => set("publicationStatus", event.target.value)} /></label>
        <label className="wide">カテゴリ<input value={item.category} onChange={(event) => set("category", event.target.value)} /></label>
        <label className="wide">サブカテゴリ<input value={item.subcategory} onChange={(event) => set("subcategory", event.target.value)} /></label>
        <label className="wide">グループ<textarea rows={2} value={item.groupName} onChange={(event) => set("groupName", event.target.value)} /></label>
      </div>
      <div className="existingProductActions">
        <button className="button" type="button" onClick={save} disabled={busy}>保存</button>
        {!item.isDamaged && <button className="button damageButton" type="button" onClick={damage} disabled={busy}>【傷あり特価】[状態A-] 化</button>}
        <span>{message}</span>
      </div>
    </article>
  );
}
