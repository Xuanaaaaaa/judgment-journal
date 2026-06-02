"use client";

import { GeistSans } from "geist/font/sans";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} h-full`}>
      <body className="flex min-h-full items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">应用启动失败</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || "请刷新页面重试。"}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-md border px-4 py-2 text-sm"
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
