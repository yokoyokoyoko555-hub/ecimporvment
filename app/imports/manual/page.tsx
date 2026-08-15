import { notFound } from "next/navigation";
import { pool } from "@/lib/db";
import { ManualImportForm, type ManualTemplate } from "./manual-import-form";
import "./manual.css";
import "./manual-code.css";

export const dynamic = "force-dynamic";

export default async function ManualImportPage() {
  if (!pool) notFound();
  const result = await pool.query<{ title_key: string; display_name: string; template_text: string; multiple_colors_label: string | null }>(
    "SELECT title_key, display_name, template_text, multiple_colors_label FROM product_name_templates ORDER BY display_name",
  );
  const templates: ManualTemplate[] = result.rows.map((item) => ({
    titleKey: item.title_key,
    displayName: item.display_name,
    templateText: item.template_text,
    multipleColorsLabel: item.multiple_colors_label,
  }));
  return <>
    <header className="topline"><div><div className="eyebrow">Manual entry</div><h1>カードを手動登録</h1><p className="subtitle">少数のカードを1件ずつ入力し、通常の取込と同じようにCSV出力できます。</p></div></header>
    <ManualImportForm templates={templates} />
  </>;
}
