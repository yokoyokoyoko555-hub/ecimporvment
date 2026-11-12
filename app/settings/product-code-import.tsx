"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ProductCodeImport() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const files = input.current?.files;
    if (!files?.length || loading) { setError(true); setMessage("CSVファイルを選択してください。"); return; }
    const body = new FormData();
    for (const file of Array.from(files)) body.append("files", file);
    setLoading(true); setError(false); setMessage("既存商品コードと枝番を確認しています…");
    try {
      const response = await fetch("/api/settings/product-codes/import", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "取込に失敗しました");
      setMessage(`${result.files}ファイル・既存商品${result.catalogProducts.toLocaleString()}件を保存しました。新しい商品コードは${result.newCodes.toLocaleString()}件です${result.skippedWithoutNumber ? `（商品番号なし ${result.skippedWithoutNumber.toLocaleString()}件は保持対象外）` : ""}。`);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "取込に失敗しました"); }
    finally { setLoading(false); }
  }
  return <form className="codeImport" onSubmit={submit}><div><b>最新版CSVを取り込む</b><p>おちゃのこから出力した商品CSVを選択します。商品番号を含む全商品データを保持し、同じ商品番号は最新版で上書きします。</p></div><div className="codeImportControls"><input ref={input} type="file" name="files" accept=".csv,text/csv" multiple disabled={loading} /><button className="button" type="submit" disabled={loading}>{loading ? "取込中…" : "CSVを取り込む"}</button></div><small>過去の商品コードと枝番も削除せず予約として保持します。取込後は「既存商品」から編集・傷あり化できます。</small>{message && <div className={error ? "importMessage importError" : "importMessage"} role="status">{message}</div>}</form>;
}
