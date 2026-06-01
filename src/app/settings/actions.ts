"use server";

import { revalidatePath } from "next/cache";

import { testConnection } from "@/lib/ai";
import { testEmbeddingConnection } from "@/lib/embedding";
import { saveSettings } from "@/lib/settings";

export type ActionResult = { ok: boolean; message: string } | null;

export async function saveSettingsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const provider = String(formData.get("provider") ?? "openai-compatible");
  const baseUrl = String(formData.get("baseUrl") ?? "").trim() || null;
  const model = String(formData.get("model") ?? "").trim() || null;
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  const embeddingBaseUrl =
    String(formData.get("embeddingBaseUrl") ?? "").trim() || null;
  const embeddingModel =
    String(formData.get("embeddingModel") ?? "").trim() || null;
  const embeddingApiKey = String(formData.get("embeddingApiKey") ?? "").trim();
  const interval = Number(formData.get("defaultReviewIntervalDays"));
  const defaultReviewIntervalDays =
    Number.isFinite(interval) && interval > 0 ? Math.floor(interval) : 90;

  try {
    await saveSettings({
      provider,
      baseUrl,
      model,
      embeddingBaseUrl,
      embeddingModel,
      defaultReviewIntervalDays,
      apiKey: apiKey || undefined, // 留空则保留已存 key
      embeddingApiKey: embeddingApiKey || undefined,
    });
    revalidatePath("/settings");
    return { ok: true, message: "配置已保存。" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "保存失败" };
  }
}

export async function testConnectionAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  return testConnection();
}

export async function testEmbeddingConnectionAction(): Promise<{
  ok: boolean;
  message: string;
}> {
  return testEmbeddingConnection();
}
