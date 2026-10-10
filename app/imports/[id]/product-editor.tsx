"use client";

import { useState } from "react";
import {
  compareByRarityAndCardNumber,
  rarityRank,
} from "@/lib/product-sort";

export interface EditableProduct {
  id: string | null;
  sourceKey: string;
  variationCode: string;
  cardNumber: string;
  cardName: string;
  rarity: string | null;
  colors: string[];
  isParallel: boolean;
  imageUrl: string | null;
  productCode: string;
  productName: string;
  salePrice: number | null;
  costPrice: number | null;
  initialStock: number | null;
  departmentId: string;
  category: string;
  subcategory: string;
  exportEnabled: boolean;
  isDamaged: boolean;
  createDamaged: boolean;
}

export function ProductEditor({
  initialProducts,
  batchId,
  sourceType,
}: {
  initialProducts: EditableProduct[];
  batchId: string;
  sourceType: string;
}) {
  const [products, setProducts] = useState(initialProducts);
  const [filter, setFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [sort, setSort] = useState<"card" | "rarity-desc" | "rarity-asc">(
    "card",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkValues, setBulkValues] = useState({
    salePrice: "",
    initialStock: "",
    departmentId: "",
    category: "",
    subcategory: "",
  });
  const availableRarities = Array.from(
    new Set(products.map((product) => product.rarity || "")),
  ).sort(
    (a, b) =>
      rarityRank(a) - rarityRank(b) ||
      a.localeCompare(b, "ja", { numeric: true }),
  );
  const shown = products
    .filter(
      (product) =>
        (rarityFilter === "all" || (product.rarity || "") === rarityFilter) &&
        `${product.cardNumber} ${product.cardName} ${product.productName}`
          .toLowerCase()
          .includes(filter.toLowerCase()),
    )
    .sort((a, b) => {
      const cardOrder = compareByRarityAndCardNumber(
        { ...a, rarity: null },
        { ...b, rarity: null },
      );
      if (sort === "rarity-desc")
        return rarityRank(a.rarity) - rarityRank(b.rarity) || cardOrder;
      if (sort === "rarity-asc")
        return rarityRank(b.rarity) - rarityRank(a.rarity) || cardOrder;
      return (
        cardOrder ||
        a.sourceKey.localeCompare(b.sourceKey, "ja", { numeric: true })
      );
    });
  const damagedTargets = shown.filter((product) => !product.isDamaged);
  const allShownDamagedSelected =
    damagedTargets.length > 0 &&
    damagedTargets.every((product) => product.createDamaged);
  const invalid = products.filter(
    (product) =>
      product.exportEnabled &&
      (!product.category ||
        (sourceType !== "onepiece" && !product.subcategory) ||
        !product.productCode),
  ).length;

  function update(
    key: string,
    field: keyof EditableProduct,
    value: string | number | boolean | null,
  ) {
    setProducts((current) =>
      current.map((product) =>
        product.sourceKey === key ? { ...product, [field]: value } : product,
      ),
    );
  }

  function applyBulk(
    field: "salePrice" | "initialStock" | "departmentId" | "category" | "subcategory",
    clear = false,
  ) {
    const value = clear ? "" : bulkValues[field];
    const shownKeys = new Set(shown.map((product) => product.sourceKey));
    setProducts((current) =>
      current.map((product) =>
        shownKeys.has(product.sourceKey)
          ? {
              ...product,
              [field]:
                field === "departmentId" ||
                field === "category" ||
                field === "subcategory"
                  ? value
                  : value === ""
                    ? null
                    : Number(value),
            }
          : product,
      ),
    );
    setMessage(
      `表示中の${shownKeys.size}件へ${clear ? "空欄" : "入力値"}を反映しました。「すべて保存」で確定してください。`,
    );
  }

  function bulkDamaged(checked: boolean) {
    const shownKeys = new Set(
      damagedTargets.map((product) => product.sourceKey),
    );
    setProducts((current) =>
      current.map((product) =>
        shownKeys.has(product.sourceKey)
          ? { ...product, createDamaged: checked }
          : product,
      ),
    );
  }

  async function saveAll() {
    const targets = products.filter(
      (product): product is EditableProduct & { id: string } =>
        Boolean(product.id),
    );
    setSaving(true);
    setMessage(`${targets.length}件を保存しています…`);
    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, products: targets }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "保存失敗");
        return;
      }
      if (result.createdDamaged > 0) {
        setMessage(
          `保存し、傷あり商品を${result.createdDamaged}件作成しました。`,
        );
        window.location.reload();
        return;
      }
      setMessage(
        `${targets.length}件を保存しました。おちゃのこ必須項目の未入力 ${result.missing}件です。`,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="editorToolbar">
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="カード名・型番で検索"
        />
        <select
          className="sortSelect"
          aria-label="カードの並び順"
          value={sort}
          onChange={(event) => setSort(event.target.value as typeof sort)}
        >
          <option value="card">型番順</option>
          <option value="rarity-desc">レアリティ順（高い順）</option>
          <option value="rarity-asc">レアリティ順（低い順）</option>
        </select>
        <select
          className="rarityFilterSelect"
          aria-label="表示するレアリティ"
          value={rarityFilter}
          onChange={(event) => setRarityFilter(event.target.value)}
        >
          <option value="all">すべてのレアリティ</option>
          {availableRarities.map((rarity) => (
            <option value={rarity} key={rarity || "no-rarity"}>
              {rarity || "レアリティなし"}だけ表示
            </option>
          ))}
        </select>
        <span className={invalid ? "validationBad" : "validationGood"}>
          {invalid
            ? `おちゃのこ必須項目 未入力 ${invalid}件`
            : "おちゃのこCSV出力 OK"}
        </span>
        <button className="button" disabled={saving} onClick={saveAll}>
          {saving ? "保存中…" : "すべて保存"}
        </button>
      </div>
      <details className="bulkPanel">
        <summary>一括編集（表示中 {shown.length}件が対象）</summary>
        <div className="bulkGrid">
          <label>
            販売価格
            <input
              type="number"
              min="0"
              value={bulkValues.salePrice}
              onChange={(event) =>
                setBulkValues((current) => ({
                  ...current,
                  salePrice: event.target.value,
                }))
              }
            />
            <span className="bulkButtons"><button type="button" onClick={() => applyBulk("salePrice")}>反映</button><button type="button" onClick={() => applyBulk("salePrice", true)}>空欄にする</button></span>
          </label>
          <label>
            在庫
            <input
              type="number"
              min="0"
              value={bulkValues.initialStock}
              onChange={(event) =>
                setBulkValues((current) => ({
                  ...current,
                  initialStock: event.target.value,
                }))
              }
            />
            <span className="bulkButtons"><button type="button" onClick={() => applyBulk("initialStock")}>反映</button><button type="button" onClick={() => applyBulk("initialStock", true)}>空欄にする</button></span>
          </label>
          <label>
            部門ID
            <input
              value={bulkValues.departmentId}
              onChange={(event) =>
                setBulkValues((current) => ({
                  ...current,
                  departmentId: event.target.value,
                }))
              }
            />
            <span className="bulkButtons"><button type="button" onClick={() => applyBulk("departmentId")}>反映</button><button type="button" onClick={() => applyBulk("departmentId", true)}>空欄にする</button></span>
          </label>
          <label>
            カテゴリ（タイトル）
            <input value={bulkValues.category} onChange={(event) => setBulkValues((current) => ({ ...current, category: event.target.value }))} />
            <span className="bulkButtons"><button type="button" onClick={() => applyBulk("category")}>反映</button><button type="button" onClick={() => applyBulk("category", true)}>空欄にする</button></span>
          </label>
          <label>
            サブカテゴリ（収録名）{sourceType === "onepiece" ? "・任意" : ""}
            <input value={bulkValues.subcategory} onChange={(event) => setBulkValues((current) => ({ ...current, subcategory: event.target.value }))} />
            <span className="bulkButtons"><button type="button" onClick={() => applyBulk("subcategory")}>反映</button><button type="button" onClick={() => applyBulk("subcategory", true)}>空欄にする</button></span>
          </label>
        </div>
        <label className="bulkDamaged">
          <input
            type="checkbox"
            checked={allShownDamagedSelected}
            disabled={damagedTargets.length === 0}
            onChange={(event) => bulkDamaged(event.target.checked)}
          />
          表示中のカードをすべて「傷あり商品も作成」にする
        </label>
        <p>
          検索・レアリティ絞り込み後に表示されているカードだけが一括編集の対象です。「反映」または「空欄にする」の後、上部の「すべて保存」を押してください。
        </p>
      </details>
      {message && <div className="notice editorMessage">{message}</div>}
      <div className="productCards">
        {shown.map((product) => (
          <article
            className={`productCard${product.isDamaged ? " damagedProduct" : ""}`}
            key={product.sourceKey}
          >
            <div className="productImage">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.cardName} />
              ) : (
                <span>画像なし</span>
              )}
            </div>
            <div className="productFields">
              <div className="cardMeta">
                <b>{product.cardNumber}</b>
                <span>{product.rarity}</span>
                {product.isParallel && <span>パラレル</span>}
                {product.isDamaged && (
                  <span className="damagedBadge">状態A-</span>
                )}
                <span>{product.colors.join("・")}</span>
              </div>
              <div className="field">
                <label>商品名</label>
                <input
                  value={product.productName}
                  onChange={(event) =>
                    update(product.sourceKey, "productName", event.target.value)
                  }
                />
              </div>
              <div className="field">
                <label>商品コード</label>
                <input
                  value={product.productCode}
                  onChange={(event) =>
                    update(product.sourceKey, "productCode", event.target.value)
                  }
                />
              </div>
              <div className="smallFields">
                <div className="field">
                  <label>販売価格</label>
                  <input
                    type="number"
                    min="0"
                    value={product.salePrice ?? ""}
                    onChange={(event) =>
                      update(
                        product.sourceKey,
                        "salePrice",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>在庫</label>
                  <input
                    type="number"
                    min="0"
                    value={product.initialStock ?? ""}
                    onChange={(event) =>
                      update(
                        product.sourceKey,
                        "initialStock",
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>部門ID</label>
                  <input
                    value={product.departmentId}
                    onChange={(event) =>
                      update(
                        product.sourceKey,
                        "departmentId",
                        event.target.value,
                      )
                    }
                  />
                </div>
              </div>
              <div className="field">
                <label>おちゃのこカテゴリ（タイトル）</label>
                <input
                  value={product.category}
                  onChange={(event) =>
                    update(product.sourceKey, "category", event.target.value)
                  }
                />
              </div>
              <div className="field">
                <label>
                  おちゃのこサブカテゴリ（収録名）
                  {sourceType === "onepiece" ? "・任意" : ""}
                </label>
                <input
                  value={product.subcategory}
                  onChange={(event) =>
                    update(product.sourceKey, "subcategory", event.target.value)
                  }
                />
              </div>
              <div className="productActions">
                <label>
                  <input
                    type="checkbox"
                    checked={product.exportEnabled}
                    onChange={(event) =>
                      update(
                        product.sourceKey,
                        "exportEnabled",
                        event.target.checked,
                      )
                    }
                  />{" "}
                  出力対象
                </label>
                {!product.isDamaged && (
                  <label className="createDamaged">
                    <input
                      type="checkbox"
                      checked={product.createDamaged}
                      onChange={(event) =>
                        update(
                          product.sourceKey,
                          "createDamaged",
                          event.target.checked,
                        )
                      }
                    />{" "}
                    傷あり商品も作成
                  </label>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
