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
      setMessage(`${result.files}ファイル・${result.uniqueCodes.toLocaleString()}コードを確認し、新しいコード${result.newCodes.toLocaleString()}件を追加しました。`);
      if (input.current) input.current.value = "";
      router.refresh();
    } catch (cause) { setError(true); setMessage(cause instanceof Error ? cause.message : "取込に失敗しました"); }
    finally { setLoading(false); }
  }
  return <form className="codeImport" onSubmit={submit}><div><b>最新版CSVを取り込む</b><p>おちゃのこから出力した商品CSVを選択します。分割ファイルはまとめて選択できます。</p></div><div className="codeImportControls"><input ref={input} type="file" name="files" accept=".csv,text/csv" multiple disabled={loading} /><button className="button" type="submit" disabled={loading}>{loading ? "取込中…" : "CSVを取り込む"}</button></div><small>過去の商品コードは削除せず予約として保持し、最新版で増えたコードと枝番だけを追加します。</small>{message && <div className={error ? "importMessage importError" : "importMessage"} role="status">{message}</div>}</form>;
}
