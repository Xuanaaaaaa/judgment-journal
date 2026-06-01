import { getSettings } from "@/lib/settings";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">设置</h1>
      <SettingsForm
        initial={{
          provider: settings?.provider ?? "openai-compatible",
          baseUrl: settings?.baseUrl ?? "",
          model: settings?.model ?? "",
          embeddingBaseUrl: settings?.embeddingBaseUrl ?? "",
          embeddingModel: settings?.embeddingModel ?? "",
          defaultReviewIntervalDays: settings?.defaultReviewIntervalDays ?? 90,
        }}
        hasApiKey={Boolean(settings?.apiKey)}
        hasEmbeddingApiKey={Boolean(settings?.embeddingApiKey)}
      />

      <div className="rounded-lg border p-6">
        <h2 className="font-medium">数据导出</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          导出全部判断及复审/验证记录为 JSON（不含 API Key 与向量）。
        </p>
        <a
          href="/api/export"
          download
          className="mt-3 inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          导出数据（JSON）
        </a>
      </div>
    </main>
  );
}
