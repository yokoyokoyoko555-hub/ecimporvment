"use client";

import { useState } from "react";

export function OchanokoSmaregiConverter() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function convert(formData: FormData) {
    if (loading) return;
    setLoading(true);
    setMessage("変換しています…");
    try {
      const response = await fetch("/api/converters/ochanoko-to-smaregi", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "CSV変換に失敗しました");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "onepiece-smaregi.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      const count = response.headers.get("X-Converted-Count") || "0";
      const skipped = response.headers.get("X-Skipped-Count") || "0";
      setMessage(
        `${count}件をスマレジCSVへ変換しました${skipped === "0" ? "。" : `。商品名・商品コード不足の${skipped}件は除外しました。`}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "CSV変換に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel converterPanel">
      <div className="panelHeader">
        <div>
          <h2>ワンピース おちゃのこCSV → スマレジCSV</h2>
          <p className="subtitle">
            おちゃのこから出力した商品CSVを、スマレジ取込用7列・CP932形式へ変換します。
          </p>
        </div>
      </div>
      <form className="converterForm" action={convert}>
        <label>
          おちゃのこ商品CSV
          <input name="file" type="file" accept=".csv,text/csv" required disabled={loading} />
        </label>
        <label>
          スマレジ部門ID
          <input name="departmentId" required disabled={loading} />
        </label>
        <button className="button" type="submit" disabled={loading}>
          {loading ? "変換中…" : "スマレジCSVへ変換"}
        </button>
      </form>
      <p className="converterNote">
        商品コードは「型番/品番」、商品単価は「販売価格」から変換します。元のCSVやデータベースは変更しません。
      </p>
      {message && <div className="notice converterMessage">{message}</div>}
    </section>
  );
}
