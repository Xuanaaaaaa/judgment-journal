import { PageHeader } from "@/components/page-header";
import { getSettings } from "@/lib/settings";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <PageHeader
        title="设置"
        description="AI 模型、偏好与数据导出。所有 Key 仅存本机 DB。"
      />
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
    </main>
  );
}
