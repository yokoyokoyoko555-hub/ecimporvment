import { pool } from "@/lib/db";
import { DEFAULT_PRODUCT_NAME_TEMPLATES } from "@/lib/product-name";
import { NameTemplateSettings, type TemplateItem } from "./name-template-settings";
import { ProductCodeImport } from "./product-code-import";
import "./settings.css";
import "./code-rule.css";
import "./product-code-import.css";

export const dynamic = "force-dynamic";
type CodeRule = { display_name: string; base_expression: string; branch_width: number; damage_suffix: string | null; special_policy: string | null; source_note: string | null; analyzed_rows: number; sequence_count: string; reserved_count: string };

export default async function SettingsPage() {
  let items: TemplateItem[] = [
    { titleKey: "onepiece", displayName: "ワンピースカード", ...DEFAULT_PRODUCT_NAME_TEMPLATES.onepiece },
    { titleKey: "digimon", displayName: "デジモンカード", ...DEFAULT_PRODUCT_NAME_TEMPLATES.digimon },
  ];
  let codeRule: CodeRule | null = null;
  if (pool) {
    const result = await pool.query<{ title_key: string; display_name: string; template_text: string; multiple_colors_label: string | null }>("SELECT title_key,display_name,template_text,multiple_colors_label FROM product_name_templates ORDER BY created_at");
    if (result.rows.length) items = result.rows.map((row) => ({ titleKey: row.title_key, displayName: row.display_name, templateText: row.template_text, multipleColorsLabel: row.multiple_colors_label }));
    const ruleResult = await pool.query<CodeRule>(`SELECT r.display_name,r.base_expression,r.branch_width,r.damage_suffix,r.special_policy,r.source_note,r.analyzed_rows,
      (SELECT count(*)::text FROM product_code_sequences s WHERE s.title_key=r.title_key) sequence_count,
      (SELECT count(*)::text FROM legacy_product_codes) reserved_count
      FROM product_code_rules r WHERE r.title_key='onepiece'`);
    codeRule = ruleResult.rows[0] || null;
  }
  return <><header className="topline"><div><div className="eyebrow">Settings</div><h1>運用設定</h1><p className="subtitle">タイトルごとの商品名や出力規則を管理します。</p></div></header>
    {codeRule && <section className="panel codeRulePanel"><div className="panelHeader"><div><h2>商品コード採番ルール</h2><p className="subtitle">既存商品と重複しないよう、過去の採番状況を保存しています。</p></div><span className="ruleStatus">適用中</span></div><details className="codeRuleDetail"><summary><div><b>{codeRule.display_name}</b><span>通常カード：型番のハイフンを除去 ＋ 2桁枝番</span></div><strong>例：OP01-001 → OP01001-01</strong></summary><div className="ruleFacts"><div><span>通常カード</span><b>{codeRule.base_expression} + {codeRule.branch_width}桁枝番</b></div><div><span>傷あり商品</span><b>元の商品コード + {codeRule.damage_suffix}</b></div><div><span>既存コード予約</span><b>{Number(codeRule.reserved_count).toLocaleString()}件</b></div><div><span>型番別の枝番記録</span><b>{Number(codeRule.sequence_count).toLocaleString()}型番</b></div></div><p>{codeRule.special_policy}</p><small>{codeRule.source_note}</small></details><ProductCodeImport /></section>}
    <NameTemplateSettings initialItems={items} />
  </>;
}
