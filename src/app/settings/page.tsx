import { getSettings } from "@/lib/settings";

import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">设置</h1>
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
