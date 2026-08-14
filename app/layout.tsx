import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import "./sidebar.css";

export const metadata: Metadata = { title: "CardFlow", description: "トレーディングカード商品登録支援" };

const nav = [{ href: "/", label: "ダッシュボード" }, { href: "/imports", label: "取込" }, { href: "/products", label: "商品" }, { href: "/exports", label: "出力" }, { href: "/settings", label: "設定" }, { href: "/guide", label: "使い方" }];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body><div className="shell">
    <aside className="sidebar"><div className="brand"><span className="brandMark">CF</span><div>CardFlow<small>商品登録支援</small></div></div>
      <nav>{nav.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
      <div className="environment">● Railway ready</div>
    </aside>
    <main className="main">{children}</main>
  </div></body></html>;
}
