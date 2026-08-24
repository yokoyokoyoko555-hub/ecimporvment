"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./import-form.css";

export type ImportSource = {
  titleKey: string;
  displayName: string;
  sourceName: string;
  scraperKey: "digimon" | "onepiece" | "lorcana" | "xross-stars";
  defaultUrl: string;
};

function defaultSet(source: ImportSource | undefined) {
  if (source?.scraperKey === "lorcana")
    return {
      name: "ＡＴＴＡＣＫ ＯＦ ＴＨＥ ＶＩＮＥ!　ヴァインズ・アタック！【DLCS13】",
      code: "DLCS13",
    };
  if (source?.scraperKey === "digimon")
    return {
      name: "エクストラブースター DIGITAL WORLD SHAMBALA【EX-12】",
      code: "EX-12",
    };
  if (source?.scraperKey === "xross-stars")
    return {
      name: "ブースターパック第4弾『Grand Resonance』【BP04】",
      code: "BP04",
    };
  return { name: "", code: "" };
}

export function ImportForm({ sources }: { sources: ImportSource[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const submitting = useRef(false);
  const [selectedKey, setSelectedKey] = useState(sources[0]?.titleKey || "");
  const selected =
    sources.find((source) => source.titleKey === selectedKey) || sources[0];
  const [sourceUrl, setSourceUrl] = useState(selected?.defaultUrl || "");
  const initialSet = defaultSet(selected);
  const [setName, setSetName] = useState(initialSet.name);
  const [setCode, setSetCode] = useState(initialSet.code);

  async function submit(formData: FormData) {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setMessage("公式サイトからカード情報を取得しています…");
    try {
      const endpoint =
        selected?.scraperKey === "digimon"
          ? "/api/imports/digimon"
          : selected?.scraperKey === "onepiece"
            ? "/api/imports/onepiece"
            : selected?.scraperKey === "lorcana"
              ? "/api/imports/lorcana"
              : selected?.scraperKey === "xross-stars"
                ? "/api/imports/xross-stars"
              : null;
      if (!endpoint) throw new Error("この取得元のスクレイパーは未対応です");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl: formData.get("sourceUrl"),
          setName: formData.get("setName"),
          setCode: formData.get("setCode"),
        }),
      });
      const result = await response.json();
      if (response.status === 409 && result.existingId) {
        setMessage("取込済みの商品セットを開きます。");
        router.push(`/imports/${result.existingId}`);
        return;
      }
      if (!response.ok) throw new Error(result.error || "取込に失敗しました");
      setMessage(`${result.cardCount}件を取得しました。取込一覧へ移動します。`);
      router.push("/imports");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "取込に失敗しました");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  if (!sources.length)
    return (
      <div className="notice">
        スクレイピングに対応した有効な取得元がありません。設定画面で取得元を有効にするか、手動登録を使用してください。
      </div>
    );
  return (
    <>
      <form className="form" action={submit} aria-busy={loading}>
        <div className="field">
          <label>取得元</label>
          <select
            value={selectedKey}
            disabled={loading}
            onChange={(event) => {
              const source = sources.find(
                (item) => item.titleKey === event.target.value,
              );
              const defaults = defaultSet(source);
              setSelectedKey(event.target.value);
              setSourceUrl(source?.defaultUrl || "");
              setSetName(defaults.name);
              setSetCode(defaults.code);
            }}
          >
            {sources.map((source) => (
              <option key={source.titleKey} value={source.titleKey}>
                {source.sourceName}（{source.displayName}）
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>カードリストURL</label>
          <input
            name="sourceUrl"
            type="url"
            required
            disabled={loading}
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </div>
        <div className="field">
          <label>商品セット名</label>
          <input
            name="setName"
            required
            disabled={loading}
            value={setName}
            onChange={(event) => setSetName(event.target.value)}
          />
        </div>
        <div className="field">
          <label>セットコード</label>
          <input
            name="setCode"
            required
            disabled={loading}
            value={setCode}
            onChange={(event) => setSetCode(event.target.value)}
          />
        </div>
        <button className="button" type="submit" disabled={loading}>
          {loading ? "取得中…" : "カード情報を取得"}
        </button>
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
      </form>
      {loading && (
        <div className="scrapingOverlay" role="status" aria-live="assertive">
          <div className="scrapingDialog">
            <span className="scrapingSpinner" aria-hidden="true" />
            <h2>スクレイピング中</h2>
            <p>
              公式サイトからカード情報を取得しています。
              <br />
              画面を閉じずにそのままお待ちください。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
