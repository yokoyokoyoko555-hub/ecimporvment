"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DamageBulkCreator({ candidateCount }: { candidateCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function create() {
    if (!confirm("パラレルではないSEC・SR・Rから、非表示の傷あり商品を一括作成しますか？")) return;
    setBusy(true);
    setMessage("作成中…");
    try {
      const response = await fetch("/api/existing-products/damage", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "作成に失敗しました");
      setMessage(`${result.created.toLocaleString()}件を作成しました。すでに作成済みの商品は除外しました。`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "作成に失敗しました");
    } finally {
      setBusy(false);
    }
  }
  return <section className="panel damageBulkPanel"><div><b>SEC・SR・R 傷あり商品</b><p>パラレルではない商品を複製し、グループ「★SALE★SEC以下」・公開状態「非表示」で作成します。未作成の対象は{candidateCount.toLocaleString()}件です。</p></div><button className="button damageButton" type="button" disabled={busy || candidateCount === 0} onClick={create}>{busy ? "作成中…" : "傷あり商品を一括作成"}</button>{message && <span>{message}</span>}</section>;
}
