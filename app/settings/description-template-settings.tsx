"use client";

import { useState } from "react";
import { renderProductDescription } from "@/lib/product-description";

export type DescriptionTemplateItem = {
  titleKey: string;
  displayName: string;
  templateText: string;
};

export function DescriptionTemplateSettings({
  initialItems,
}: {
  initialItems: DescriptionTemplateItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);

  async function save(item: DescriptionTemplateItem) {
    setMessage("保存しています…");
    const response = await fetch("/api/settings/description-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? `${item.displayName}の商品説明テンプレートを保存しました。`
        : result.error || "保存に失敗しました",
    );
  }

  return (
    <section className="panel descriptionTemplates">
      <div className="panelHeader">
        <div>
          <h2>商品説明テンプレート</h2>
          <p className="subtitle">
            おちゃのこCSVの商品説明をタイトルごとに設定します。HTMLを使用できます。
          </p>
        </div>
      </div>
      <div className="templateList">
        {items.map((item, index) => {
          const preview = renderProductDescription(item.templateText, {
            productName: "カード名【SR】【赤】【XX01-001】",
            cardName: "カード名",
            rarity: "SR",
            colors: ["赤"],
            cardNumber: "XX01-001",
            setName: "ブースターパック サンプル【XX-01】",
            setCode: "XX-01",
          });
          return (
            <details className="templateEditor" key={item.titleKey}>
              <summary className="templateSummary">
                <div>
                  <h3>{item.displayName}</h3>
                  <span>{item.titleKey}</span>
                </div>
                <strong>{preview.replace(/<[^>]+>/g, " ")}</strong>
              </summary>
              <div className="templateContent">
                <div className="field">
                  <label>商品説明テンプレート</label>
                  <textarea
                    rows={6}
                    value={item.templateText}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((entry, itemIndex) =>
                          itemIndex === index
                            ? { ...entry, templateText: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                </div>
                <div className="templatePreview">
                  <span>プレビュー</span>
                  <div>{preview.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")}</div>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => save(item)}
                >
                  保存
                </button>
              </div>
            </details>
          );
        })}
      </div>
      <div className="templateHelp">
        <b>使用できる項目：</b> <code>{"{{product_name}}"}</code> 商品名、
        <code>{"{{card_name}}"}</code> カード名、
        <code>{"{{rarity}}"}</code> レアリティ、
        <code>{"{{color}}"}</code> 色、
        <code>{"{{card_number}}"}</code> 型番、
        <code>{"{{set_name}}"}</code> 収録名、
        <code>{"{{set_code}}"}</code> セットコード
      </div>
      {message && <div className="notice templateMessage">{message}</div>}
    </section>
  );
}
