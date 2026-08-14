"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setLoading(true); setMessage("公式サイトからカード情報を取得しています…");
    try {
      const response = await fetch("/api/imports/digimon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl: formData.get("sourceUrl"), setName: formData.get("setName"), setCode: formData.get("setCode") }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "取込に失敗しました");
      setMessage(`${result.cardCount}件を取得しました。取込一覧へ移動します。`);
      router.push("/imports"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "取込に失敗しました"); }
    finally { setLoading(false); }
  }

  return <form className="form" action={submit}>
    <div className="field"><label>取得元</label><select disabled><option>デジモンカード公式</option></select></div>
    <div className="field"><label>カードリストURL</label><input name="sourceUrl" type="url" required defaultValue="https://digimoncard.com/cards/?search=true&category=503039" /></div>
    <div className="field"><label>商品セット名</label><input name="setName" required defaultValue="エクストラブースター DIGITAL WORLD SHAMBALA【EX-12】" /></div>
    <div className="field"><label>セットコード</label><input name="setCode" required defaultValue="EX-12" /></div>
    <button className="button" type="submit" disabled={loading}>{loading ? "取得中…" : "カード情報を取得"}</button>
    {message && <div className="notice" role="status">{message}</div>}
  </form>;
}
