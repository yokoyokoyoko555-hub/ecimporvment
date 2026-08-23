"use client";
import { useState } from "react";

export type CatalogSourceItem = {
  titleKey: string;
  displayName: string;
  sourceName: string;
  acquisitionMethod: "manual" | "scraping";
  scraperKey: "digimon" | "onepiece" | null;
  defaultUrl: string;
  active: boolean;
};

export function CatalogSourceSettings({
  initialItems,
}: {
  initialItems: CatalogSourceItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  function update(
    index: number,
    field: keyof CatalogSourceItem,
    value: string | boolean | null,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }
  async function save(item: CatalogSourceItem) {
    setMessage("保存しています…");
    const response = await fetch("/api/settings/catalog-sources", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? `${item.displayName}の取得設定を保存しました。`
        : result.error || "保存に失敗しました",
    );
  }
  return (
    <section className="panel sourceSettings">
      <div className="panelHeader">
        <div>
          <h2>取扱タイトル・取得元管理</h2>
          <p className="subtitle">
            取扱タイトルの有効／無効と、カード情報の取得方法を設定します。
          </p>
        </div>
      </div>
      <div className="sourceList">
        {items.map((item, index) => (
          <details className="sourceItem" key={item.titleKey}>
            <summary>
              <div>
                <b>{item.displayName}</b>
                <span>
                  {item.acquisitionMethod === "scraping"
                    ? item.sourceName
                    : "手動登録"}
                </span>
              </div>
              <em className={item.active ? "sourceActive" : "sourceInactive"}>
                {item.active ? "取扱中" : "停止中"}
              </em>
            </summary>
            <div className="sourceBody">
              <div className="sourceGrid">
                <div className="field">
                  <label>取得方法</label>
                  <select
                    value={item.acquisitionMethod}
                    onChange={(event) =>
                      update(index, "acquisitionMethod", event.target.value)
                    }
                  >
                    <option value="manual">手動登録のみ</option>
                    <option value="scraping">スクレイピング</option>
                  </select>
                </div>
                <div className="field">
                  <label>取得元名</label>
                  <input
                    value={item.sourceName}
                    onChange={(event) =>
                      update(index, "sourceName", event.target.value)
                    }
                    placeholder="メーカー公式サイト"
                  />
                </div>
                <label className="sourceCheck">
                  <input
                    type="checkbox"
                    checked={item.active}
                    onChange={(event) =>
                      update(index, "active", event.target.checked)
                    }
                  />{" "}
                  このタイトルを取扱中にする
                </label>
              </div>
              {item.acquisitionMethod === "scraping" && (
                <>
                  <div className="sourceGrid2">
                    <div className="field">
                      <label>対応スクレイパー</label>
                      <select
                        value={item.scraperKey || ""}
                        onChange={(event) =>
                          update(
                            index,
                            "scraperKey",
                            event.target.value || null,
                          )
                        }
                      >
                        <option value="">選択してください</option>
                        <option value="digimon">
                          デジモンカード公式（対応済み）
                        </option>
                        <option value="onepiece">
                          ONE PIECEカードゲーム公式（対応済み）
                        </option>
                      </select>
                    </div>
                    <div className="field">
                      <label>標準カードリストURL</label>
                      <input
                        type="url"
                        value={item.defaultUrl}
                        onChange={(event) =>
                          update(index, "defaultUrl", event.target.value)
                        }
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <p className="sourceCaution">
                    URLを登録するだけでは新しいサイトを取得できません。サイトごとのスクレイパー対応が必要です。
                  </p>
                </>
              )}
              <button
                className="button secondary"
                type="button"
                onClick={() => save(item)}
              >
                保存
              </button>
            </div>
          </details>
        ))}
      </div>
      {message && <div className="notice sourceMessage">{message}</div>}
      <div className="sourceHelp">
        新しいタイトルは、下の「商品名テンプレート」で追加すると、手動登録タイトルとしてここへ追加されます。
      </div>
    </section>
  );
}
