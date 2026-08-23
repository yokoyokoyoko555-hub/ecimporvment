"use client";

import { useState } from "react";

export function DownloadButton({ batchId, type, disabledReason }: { batchId: string; type: string; disabledReason?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    if (disabledReason) { setError(disabledReason); return; }
    if (loading) return;
    setLoading(true); setError(null);
    try {
      const response = await fetch(`/api/exports?type=${type}&batch=${batchId}`);
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || `出力に失敗しました（${response.status}）`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const fileName = disposition.match(/filename="?([^";]+)"?/)?.[1] || `export-${type}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = fileName; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "出力に失敗しました");
    } finally { setLoading(false); }
  }

  return <div className="downloadArea"><button className="button" type="button" onClick={download} disabled={loading}>{loading ? "生成中…" : "ダウンロード"}</button>{error && <p className="downloadError" role="alert">{error}</p>}</div>;
}
