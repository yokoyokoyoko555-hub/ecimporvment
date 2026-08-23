"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { renderProductName } from "@/lib/product-name";

export type TemplateItem = {
  titleKey: string;
  displayName: string;
  templateText: string;
  multipleColorsLabel: string | null;
};
const newItem = (): TemplateItem => ({
  titleKey: "",
  displayName: "",
  templateText: "{{name}}【{{rarity}}】【{{color}}】【{{card_number}}】",
  multipleColorsLabel: null,
});

export function NameTemplateSettings({
  initialItems,
}: {
  initialItems: TemplateItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  const previews = useMemo(
    () =>
      items.map((item) =>
        renderProductName(item, {
          name: "カード名",
          rarity: "SR",
          cardNumber: "XX01-001",
          colors: ["赤", "青"],
        }),
      ),
    [items],
  );

  function update(index: number, field: keyof TemplateItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value || (field === "multipleColorsLabel" ? null : ""),
            }
          : item,
      ),
    );
  }

  async function save(item: TemplateItem) {
    setMessage("保存しています…");
    const response = await fetch("/api/settings/name-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? `${item.displayName}の商品名テンプレートを保存しました。`
        : result.error || "保存に失敗しました",
    );
    if (response.ok) router.refresh();
  }

  async function remove(item: TemplateItem, index: number) {
    const saved = initialItems.some(
      (initial) => initial.titleKey === item.titleKey,
    );
    if (!saved) {
      setItems((current) =>
        current.filter((_, itemIndex) => itemIndex !== index),
      );
      return;
    }
    if (!window.confirm(`「${item.displayName}」を削除しますか？`)) return;
    setMessage("削除しています…");
    const response = await fetch("/api/settings/name-templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleKey: item.titleKey }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "削除に失敗しました");
      return;
    }
    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
    setMessage(`${item.displayName}を削除しました。`);
    router.refresh();
  }

  return (
    <section className="panel">
      <div className="panelHeader">
        <div>
          <h2>商品名テンプレート</h2>
          <p className="subtitle">
            タイトルごとに項目の順番、括弧、空白を設定します。
          </p>
        </div>
        <button
          className="button"
          type="button"
          onClick={() => setItems((current) => [...current, newItem()])}
        >
          ＋ タイトル追加
        </button>
      </div>
      <div className="templateList">
        {items.map((item, index) => (
          <details className="templateEditor" key={index}>
            <summary className="templateSummary">
              <div>
                <h3>{item.displayName || "新しいタイトル"}</h3>
                <span>{item.titleKey || "識別キー未設定"}</span>
              </div>
              <strong>{previews[index]}</strong>
            </summary>
            <div className="templateContent">
              <div className="templateRow">
                <div className="field">
                  <label>タイトル名</label>
                  <input
                    value={item.displayName}
                    onChange={(event) =>
                      update(index, "displayName", event.target.value)
                    }
                    placeholder="ポケモンカード"
                  />
                </div>
                <div className="field">
                  <label>識別キー</label>
                  <input
                    value={item.titleKey}
                    onChange={(event) =>
                      update(
                        index,
                        "titleKey",
                        event.target.value.toLowerCase(),
                      )
                    }
                    placeholder="pokemon"
                    disabled={initialItems.some(
                      (initial) => initial.titleKey === item.titleKey,
                    )}
                  />
                </div>
              </div>
              <div className="field">
                <label>テンプレート</label>
                <input
                  value={item.templateText}
                  onChange={(event) =>
                    update(index, "templateText", event.target.value)
                  }
                />
              </div>
              <div className="field">
                <label>複数色の場合の表示（空欄なら「赤・青」）</label>
                <input
                  value={item.multipleColorsLabel || ""}
                  onChange={(event) =>
                    update(index, "multipleColorsLabel", event.target.value)
                  }
                  placeholder="多"
                />
              </div>
              <div className="templatePreview">
                <span>プレビュー</span>
                <strong>{previews[index]}</strong>
              </div>
              <div className="templateActions">
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => save(item)}
                >
                  保存
                </button>
                {!["onepiece", "digimon"].includes(item.titleKey) && (
                  <button
                    className="button dangerButton"
                    type="button"
                    onClick={() => remove(item, index)}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
      <div className="templateHelp">
        <b>使用できる項目：</b> <code>{"{{name}}"}</code> 名前、
        <code>{"{{rarity}}"}</code> レアリティ、<code>{"{{color}}"}</code> 色、
        <code>{"{{card_number}}"}</code> 型番、<code>{"{{set_code}}"}</code>{" "}
        セットコード、<code>{"{{parallel}}"}</code> パラレル
      </div>
      {message && (
        <div className="notice templateMessage" role="status">
          {message}
        </div>
      )}
    </section>
  );
}
