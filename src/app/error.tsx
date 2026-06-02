"use client";

import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="text-lg font-semibold">这个页面出错了</h1>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {error.message || "未知错误，请稍后重试。"}
      </p>
      <Button onClick={reset} className="mt-4">
        <RotateCw className="h-4 w-4" />
        重试
      </Button>
    </main>
  );
}
