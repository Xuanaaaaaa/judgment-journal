import type { Metadata } from "next";
import Link from "next/link";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Judgment Journal",
  description: "AI 辅助的个人判断力训练工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <nav className="mx-auto flex w-full max-w-3xl items-center gap-6 px-8 py-3 text-sm">
            <Link href="/" className="font-semibold">
              判断日志
            </Link>
            <Link href="/library" className="text-muted-foreground hover:text-foreground">
              判断库
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              仪表盘
            </Link>
            <Link href="/settings" className="text-muted-foreground hover:text-foreground">
              设置
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
