"use client";

import { useState } from "react";

export function RefreshImportButton({ batchId }: { batchId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    if (loading) return;
    setLoading(true);
    setMessage("公式カードリストの更新を確認しています…");
    try {
      const response = await fetch(`/api/imports/${batchId}/refresh`, {
        method: "POST",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "公式データの更新に失敗しました");
      const retained = result.retained
        ? `・取得元から消えた既存${result.retained}件は保持`
        : "";
      window.alert(
        `公式データの更新が完了しました。追加${result.added}件・更新${result.updated}件${retained}`,
      );
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "公式データの更新に失敗しました");
      setLoading(false);
    }
  }

  return (
    <div className="refreshImport">
      <button
        className="button secondary"
        type="button"
        disabled={loading}
        onClick={refresh}
      >
        {loading ? "更新中…" : "公式データを更新"}
      </button>
      {message && <span role="status">{message}</span>}
    </div>
  );
}
