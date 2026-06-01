import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { embed } from "ai";

import { EMBEDDING_DIMENSIONS } from "./schema";
import { getSettings } from "./settings";

// createOpenAICompatible 的 name 同时作为 providerOptions 的键名。
const PROVIDER_NAME = "embedding";

// 给生成调用设上限：embedding 在录入提交的关键路径上，
// provider 卡住时超时中断并回退（调用方置 null 不阻塞录入）。
const EMBEDDING_TIMEOUT_MS = 10_000;

async function getEmbeddingModel() {
  const s = await getSettings();
  if (!s?.embeddingApiKey || !s.embeddingBaseUrl || !s.embeddingModel) {
    throw new Error(
      "Embedding 尚未配置：请在设置页填写 Embedding 的 Base URL、模型和 API Key。",
    );
  }
  const provider = createOpenAICompatible({
    name: PROVIDER_NAME,
    apiKey: s.embeddingApiKey,
    baseURL: s.embeddingBaseUrl,
  });
  return provider.textEmbeddingModel(s.embeddingModel);
}

// 是否已配置 embedding（用于在录入流程中决定要不要做关联检索）。
export async function isEmbeddingConfigured(): Promise<boolean> {
  const s = await getSettings();
  return Boolean(s?.embeddingApiKey && s.embeddingBaseUrl && s.embeddingModel);
}

// 生成单条文本的向量；校验返回维度与建表维度一致，否则报错（避免写入失败或脏数据）。
export async function generateEmbedding(text: string): Promise<number[]> {
  const model = await getEmbeddingModel();
  const { embedding } = await embed({
    model,
    value: text,
    abortSignal: AbortSignal.timeout(EMBEDDING_TIMEOUT_MS),
    providerOptions: {
      [PROVIDER_NAME]: { dimensions: EMBEDDING_DIMENSIONS },
    },
  });
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Embedding 维度不匹配：模型返回 ${embedding.length} 维，期望 ${EMBEDDING_DIMENSIONS} 维。` +
        `请换支持 ${EMBEDDING_DIMENSIONS} 维的模型，或调整 EMBEDDING_DIMENSIONS 并重建表。`,
    );
  }
  return embedding;
}

export async function testEmbeddingConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const v = await generateEmbedding("连接测试");
    return { ok: true, message: `连接成功，返回 ${v.length} 维向量。` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
