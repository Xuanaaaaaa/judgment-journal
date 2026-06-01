import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, type LanguageModel } from "ai";

import { getSettings } from "./settings";

// 目前只接入 OpenAI 兼容 provider（DeepSeek 等）。
// anthropic / openai 原生路径留待后续按需接入。
export async function getChatModel(): Promise<LanguageModel> {
  const s = await getSettings();
  if (!s?.apiKey || !s.baseUrl || !s.model) {
    throw new Error("AI 尚未配置：请在设置页填写 API Key、Base URL 和模型。");
  }
  if (s.provider !== "openai-compatible") {
    throw new Error(
      `provider「${s.provider}」尚未接入，当前仅支持 OpenAI 兼容（openai-compatible）。`,
    );
  }
  const provider = createOpenAICompatible({
    name: s.provider,
    apiKey: s.apiKey,
    baseURL: s.baseUrl,
  });
  return provider(s.model);
}

export async function testConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const model = await getChatModel();
    const { text } = await generateText({
      model,
      prompt: "请只回复两个字：可以",
    });
    return { ok: true, message: `连接成功，模型回复：${text.trim().slice(0, 50)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
