"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { renderProductName } from "@/lib/product-name";

export type ManualTemplate = { titleKey: string; displayName: string; templateText: string; multipleColorsLabel: string | null };
type CardInput = { key: string; cardName: string; cardNumber: string; rarity: string; colorsText: string; isParallel: boolean; imageUrl: string; autoProductCode: boolean; productCode: string; productName: string; salePrice: string; costPrice: string; initialStock: string; departmentId: string; category: string };

const emptyCard = (): CardInput => ({ key: crypto.randomUUID(), cardName: "", cardNumber: "", rarity: "", colorsText: "", isParallel: false, imageUrl: "", autoProductCode: true, productCode: "", productName: "", salePrice: "", costPrice: "", initialStock: "0", departmentId: "", category: "" });
const colorsOf = (text: string) => text.split(/[、,，・]/).map((value) => value.trim()).filter(Boolean);
const codePrefix = (titleKey: string) => titleKey === "digimon" ? "DG" : titleKey === "onepiece" ? "OP" : titleKey.slice(0, 3).toUpperCase();

export function ManualImportForm({ templates }: { templates: ManualTemplate[] }) {
  const router = useRouter();
  const [titleKey, setTitleKey] = useState(templates[0]?.titleKey || "");
  const [setName, setSetName] = useState("");
  const [setCode, setSetCode] = useState("");
  const [cards, setCards] = useState<CardInput[]>([emptyCard()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const template = useMemo(() => templates.find((item) => item.titleKey === titleKey), [templates, titleKey]);

  function update(key: string, field: keyof CardInput, value: string | boolean) {
    setCards((current) => current.map((card) => {
      if (card.key !== key) return card;
      const next = { ...card, [field]: value };
      if (field === "cardNumber" && typeof value === "string" && (!card.productCode || card.productCode === suggestedCode(card, titleKey))) {
        next.productCode = `${codePrefix(titleKey)}-${value}-${card.isParallel ? "P" : "N"}`.replace(/[^A-Za-z0-9_-]/g, "");
      }
      return next;
    }));
  }

  function suggestedCode(card: CardInput, selectedTitleKey: string) {
    return `${codePrefix(selectedTitleKey)}-${card.cardNumber}-${card.isParallel ? "P" : "N"}`.replace(/[^A-Za-z0-9_-]/g, "");
  }

  function preview(card: CardInput) {
    if (card.productName) return card.productName;
    if (!template) return card.cardName;
    return renderProductName(template, { name: card.cardName || "カード名", rarity: card.rarity, colors: colorsOf(card.colorsText), cardNumber: card.cardNumber || "型番", setCode, isParallel: card.isParallel });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setMessage("登録しています…");
    const payload = { titleKey, setName, setCode, cards: cards.map((card) => ({
      cardName: card.cardName, cardNumber: card.cardNumber, rarity: card.rarity || null,
      colors: colorsOf(card.colorsText), isParallel: card.isParallel, imageUrl: card.imageUrl || null,
      productCode: titleKey === "onepiece" && card.autoProductCode ? undefined : card.productCode || undefined, productName: card.productName || undefined,
      salePrice: card.salePrice === "" ? null : Number(card.salePrice), costPrice: card.costPrice === "" ? null : Number(card.costPrice),
      initialStock: Number(card.initialStock || 0), departmentId: card.departmentId || null, category: card.category || null,
    })) };
    try {
      const response = await fetch("/api/imports/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "登録に失敗しました");
      router.push(`/imports/${result.id}`); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "登録に失敗しました"); setSaving(false); }
  }

  return <form className="manualForm" onSubmit={submit}>
    <section className="panel manualBatch"><div className="panelHeader"><div><h2>登録グループ</h2><p className="subtitle">同時に登録するカードをまとめる名前です。</p></div></div><div className="manualBatchFields">
      <div className="field"><label>タイトル</label><select value={titleKey} onChange={(event) => setTitleKey(event.target.value)} required>{templates.map((item) => <option key={item.titleKey} value={item.titleKey}>{item.displayName}</option>)}</select></div>
      <div className="field"><label>商品セット名</label><input value={setName} onChange={(event) => setSetName(event.target.value)} required placeholder="例：プロモーションカード 2026年8月" /></div>
      <div className="field"><label>セットコード</label><input value={setCode} onChange={(event) => setSetCode(event.target.value)} required placeholder="例：PROMO-2608" /></div>
    </div></section>
    <div className="manualListHeader"><div><h2>カード情報</h2><p className="subtitle">色が複数ある場合は「赤、青」のように区切って入力します。</p></div><button className="button secondary" type="button" onClick={() => setCards((current) => [...current, emptyCard()])}>＋ カードを追加</button></div>
    <div className="manualCards">{cards.map((card, index) => <details className="manualCard" key={card.key} open>
      <summary><span><b>{index + 1}. {card.cardName || "新しいカード"}</b><small>{card.cardNumber || "型番未入力"}</small></span><strong>{preview(card)}</strong></summary>
      <div className="manualCardBody">
        <div className="manualGrid3"><div className="field"><label>カード名 *</label><input value={card.cardName} onChange={(e) => update(card.key, "cardName", e.target.value)} required /></div><div className="field"><label>型番 *</label><input value={card.cardNumber} onChange={(e) => update(card.key, "cardNumber", e.target.value)} required /></div><div className="field"><label>レアリティ</label><input value={card.rarity} onChange={(e) => update(card.key, "rarity", e.target.value)} /></div></div>
        <div className="manualGrid3"><div className="field"><label>色</label><input value={card.colorsText} onChange={(e) => update(card.key, "colorsText", e.target.value)} placeholder="赤、青" /></div><div className="field"><label>画像URL</label><input type="url" value={card.imageUrl} onChange={(e) => update(card.key, "imageUrl", e.target.value)} placeholder="https://..." /></div><label className="checkField"><input type="checkbox" checked={card.isParallel} onChange={(e) => update(card.key, "isParallel", e.target.checked)} /> パラレルカード</label></div>
        <div className="manualGrid2"><div className="field"><label>商品コード{titleKey === "onepiece" && card.autoProductCode ? "（自動採番）" : " *"}</label><input value={titleKey === "onepiece" && card.autoProductCode ? "" : card.productCode} onChange={(e) => update(card.key, "productCode", e.target.value)} required={titleKey !== "onepiece" || !card.autoProductCode} disabled={titleKey === "onepiece" && card.autoProductCode} placeholder={titleKey === "onepiece" && card.autoProductCode ? "例：OP01001-03（登録時に既存枝番の続きで採番）" : "半角英数字・ハイフン・アンダーバー"} pattern="[A-Za-z0-9_-]+" />{titleKey === "onepiece" && <label className="inlineCheck"><input type="checkbox" checked={card.autoProductCode} onChange={(e) => update(card.key, "autoProductCode", e.target.checked)} /> 既存ルールで自動採番する</label>}</div><div className="field"><label>商品名（空欄ならテンプレートで自動作成）</label><input value={card.productName} onChange={(e) => update(card.key, "productName", e.target.value)} placeholder={preview(card)} /></div></div>
        <div className="manualGrid5"><div className="field"><label>販売価格</label><input type="number" min="0" value={card.salePrice} onChange={(e) => update(card.key, "salePrice", e.target.value)} /></div><div className="field"><label>原価</label><input type="number" min="0" value={card.costPrice} onChange={(e) => update(card.key, "costPrice", e.target.value)} /></div><div className="field"><label>在庫</label><input type="number" min="0" value={card.initialStock} onChange={(e) => update(card.key, "initialStock", e.target.value)} /></div><div className="field"><label>部門ID</label><input value={card.departmentId} onChange={(e) => update(card.key, "departmentId", e.target.value)} /></div><div className="field"><label>おちゃのこカテゴリ</label><input value={card.category} onChange={(e) => update(card.key, "category", e.target.value)} /></div></div>
        {cards.length > 1 && <button className="removeButton" type="button" onClick={() => setCards((current) => current.filter((item) => item.key !== card.key))}>このカードを削除</button>}
      </div>
    </details>)}</div>
    <div className="manualSubmit"><span>{message}</span><button className="button" type="submit" disabled={saving}>{saving ? "登録中…" : `${cards.length}件を登録`}</button></div>
  </form>;
}
