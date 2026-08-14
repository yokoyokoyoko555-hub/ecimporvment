"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./import-form.css";

export function ImportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const submitting = useRef(false);

  async function submit(formData: FormData) {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true); setMessage("公式サイトからカード情報を取得しています…");
    try {
      const response = await fetch("/api/imports/digimon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl: formData.get("sourceUrl"), setName: formData.get("setName"), setCode: formData.get("setCode") }) });
      const result = await response.json();
      if (response.status === 409 && result.existingId) { setMessage("取込済みの商品セットを開きます。"); router.push(`/imports/${result.existingId}`); return; }
      if (!response.ok) throw new Error(result.error || "取込に失敗しました");
      setMessage(`${result.cardCount}件を取得しました。取込一覧へ移動します。`);
      router.push("/imports"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "取込に失敗しました"); }
    finally { submitting.current = false; setLoading(false); }
  }

  return <><form className="form" action={submit} aria-busy={loading}>
    <div className="field"><label>取得元</label><select disabled><option>デジモンカード公式</option></select></div>
    <div className="field"><label>カードリストURL</label><input name="sourceUrl" type="url" required disabled={loading} defaultValue="https://digimoncard.com/cards/?search=true&category=503039" /></div>
    <div className="field"><label>商品セット名</label><input name="setName" required disabled={loading} defaultValue="エクストラブースター DIGITAL WORLD SHAMBALA【EX-12】" /></div>
    <div className="field"><label>セットコード</label><input name="setCode" required disabled={loading} defaultValue="EX-12" /></div>
    <button className="button" type="submit" disabled={loading}>{loading ? "取得中…" : "カード情報を取得"}</button>
    {message && <div className="notice" role="status">{message}</div>}
  </form>{loading && <div className="scrapingOverlay" role="status" aria-live="assertive"><div className="scrapingDialog"><span className="scrapingSpinner" aria-hidden="true"/><h2>スクレイピング中</h2><p>公式サイトからカード情報を取得しています。<br/>画面を閉じずにそのままお待ちください。</p></div></div>}</>;
}
