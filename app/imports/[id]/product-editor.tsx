"use client";

import { useState } from "react";
import { needsDigimonSpReview } from "@/lib/product-review";

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
  const [spReviewOnly, setSpReviewOnly] = useState(false);
  const [sort, setSort] = useState<"card" | "rarity-desc" | "rarity-asc">(
    "card",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const rarityOrder = [
    "アイコニック",
    "エンチャンテッド",
    "エピック",
    "スーパーパラレル",
    "SEC",
    "SP",
    "レジェンダリー",
    "リーダーパラレル",
    "パラレル",
    "L",
    "スーパーレア",
    "SR",
    "レア",
    "R",
    "アンコモン",
    "UC",
    "U",
    "コモン",
    "C",
    "P",
  ];
  const rarityRank = (rarity: string | null) => {
    const rank = rarityOrder.indexOf(rarity || "");
    return rank === -1 ? rarityOrder.length : rank;
  };
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
        (!spReviewOnly ||
          needsDigimonSpReview(
            sourceType,
            product.variationCode,
            product.productName,
          )) &&
        `${product.cardNumber} ${product.cardName} ${product.productName}`
          .toLowerCase()
          .includes(filter.toLowerCase()),
    )
    .sort((a, b) => {
      const cardOrder = a.cardNumber.localeCompare(b.cardNumber, "ja", {
        numeric: true,
      });
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
      (!product.category || !product.subcategory || !product.productCode),
  ).length;
  const spReviewCount = products.filter((product) =>
    needsDigimonSpReview(
      sourceType,
      product.variationCode,
      product.productName,
    ),
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

  function bulk(
    field: "salePrice" | "initialStock" | "departmentId" | "category" | "subcategory",
    value: string,
  ) {
    setProducts((current) =>
      current.map((product) => ({
        ...product,
        [field]:
          field === "departmentId" || field === "category" || field === "subcategory"
            ? value
            : value === ""
              ? null
              : Number(value),
      })),
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
        {(spReviewCount > 0 || spReviewOnly) && (
          <button
            type="button"
            className={`spReviewCount${spReviewOnly ? " active" : ""}`}
            aria-pressed={spReviewOnly}
            onClick={() => setSpReviewOnly((current) => !current)}
            title="クリックしてSP要確認カードだけを表示"
          >
            {spReviewOnly ? "全件表示へ戻る" : `SP表記 要確認 ${spReviewCount}件`}
          </button>
        )}
        <button className="button" disabled={saving} onClick={saveAll}>
          {saving ? "保存中…" : "すべて保存"}
        </button>
      </div>
      <details className="bulkPanel">
        <summary>一括編集</summary>
        <div className="bulkGrid">
          <label>
            販売価格
            <input
              type="number"
              min="0"
              onChange={(event) => bulk("salePrice", event.target.value)}
            />
          </label>
          <label>
            在庫
            <input
              type="number"
              min="0"
              onChange={(event) => bulk("initialStock", event.target.value)}
            />
          </label>
          <label>
            部門ID
            <input
              onChange={(event) => bulk("departmentId", event.target.value)}
            />
          </label>
          <label>
            カテゴリ（タイトル）
            <input onChange={(event) => bulk("category", event.target.value)} />
          </label>
          <label>
            サブカテゴリ（収録名）
            <input onChange={(event) => bulk("subcategory", event.target.value)} />
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
          検索中は、表示されているカードだけが一括選択の対象です。入力後、上部の「すべて保存」を押してください。
        </p>
      </details>
      {message && <div className="notice editorMessage">{message}</div>}
      <div className="productCards">
        {shown.map((product) => {
          const needsSpReview = needsDigimonSpReview(
            sourceType,
            product.variationCode,
            product.productName,
          );
          return (
          <article
            className={`productCard${product.isDamaged ? " damagedProduct" : ""}${needsSpReview ? " spReviewProduct" : ""}`}
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
                {needsSpReview && (
                  <span className="spReviewBadge">SP候補・要対応</span>
                )}
                <span>{product.colors.join("・")}</span>
              </div>
              {needsSpReview && (
                <div className="spReviewNotice">
                  このP2画像はSPの可能性があります。画像を確認し、商品名のレアリティを【SP】に修正してください。
                </div>
              )}
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
                <label>おちゃのこサブカテゴリ（収録名）</label>
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
          );
        })}
      </div>
    </>
  );
}
