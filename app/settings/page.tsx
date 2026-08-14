import { pool } from "@/lib/db";
import { DEFAULT_PRODUCT_NAME_TEMPLATES } from "@/lib/product-name";
import { NameTemplateSettings, type TemplateItem } from "./name-template-settings";
import "./settings.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let items: TemplateItem[] = [
    { titleKey: "onepiece", displayName: "ワンピースカード", ...DEFAULT_PRODUCT_NAME_TEMPLATES.onepiece },
    { titleKey: "digimon", displayName: "デジモンカード", ...DEFAULT_PRODUCT_NAME_TEMPLATES.digimon },
  ];
  if (pool) {
    const result = await pool.query<{ title_key: string; display_name: string; template_text: string; multiple_colors_label: string | null }>("SELECT title_key,display_name,template_text,multiple_colors_label FROM product_name_templates ORDER BY created_at");
    if (result.rows.length) items = result.rows.map((row) => ({ titleKey: row.title_key, displayName: row.display_name, templateText: row.template_text, multipleColorsLabel: row.multiple_colors_label }));
  }
  return <><header className="topline"><div><div className="eyebrow">Settings</div><h1>運用設定</h1><p className="subtitle">タイトルごとの商品名や出力規則を管理します。</p></div></header><NameTemplateSettings initialItems={items} /></>;
}
