import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateObject, generateText } from "ai";

import { todayLocal } from "./date";
import { parsedJudgmentSchema, type ParsedJudgment } from "./schemas";
import { getSettings } from "./settings";

// createOpenAICompatible 的 name 同时作为 providerOptions 的键名。
const PROVIDER_NAME = "deepseek";

// 目前只接入 OpenAI 兼容 provider（DeepSeek 等）。
// anthropic / openai 原生路径留待后续按需接入。
async function getChatModel() {
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
    name: PROVIDER_NAME,
    apiKey: s.apiKey,
    baseURL: s.baseUrl,
  });
  // DeepSeek v4 模型默认可能走思考模式；解析/测试用非思考模式更快更稳。
  const providerOptions = s.baseUrl.includes("deepseek")
    ? { [PROVIDER_NAME]: { thinking: { type: "disabled" } } }
    : undefined;
  return { model: provider(s.model), providerOptions };
}

// 把用户的自然语言解析成结构化判断。confidence 不解析（留给用户填）。
export async function parseJudgment(input: string): Promise<ParsedJudgment> {
  const { model, providerOptions } = await getChatModel();
  const today = todayLocal();
  const { object } = await generateObject({
    model,
    providerOptions,
    schema: parsedJudgmentSchema,
    system: [
      "你是判断力训练工具的解析助手，把用户的自然语言整理成结构化判断。",
      `今天是 ${today}，遇到「明年底」「三个月后」等相对时间请据此换算成具体日期。`,
      "规则：有明确时间锚点/可验证截止日期的归为 prediction 并给出 deadline；",
      "对某事物的持续看法、没有自然终点的归为 stance，reviewIntervalDays 默认 90。",
      "不要臆造信息：理由/事前验尸用户没提到就填 null。绝不输出置信度。",
      "只输出如下结构的 JSON，键名必须完全一致、不得增删：",
      '{"type":"prediction"|"stance","title":"一句话命题(必填)",',
      '"reasoning":"理由,无则null","preMortem":"如果错了最可能的原因,无则null",',
      '"domain":["领域标签"](无则[]),',
      '"deadline":"YYYY-MM-DD"(prediction截止日;stance或无则null),',
      '"reviewIntervalDays":数字(stance复审周期,默认90;prediction则null)}',
    ].join(""),
    prompt: input,
  });
  return object;
}

// 用一两句话总结新判断与若干历史判断的关系或矛盾（design §5.2 第4步）。
export async function summarizeRelation(
  newTitle: string,
  related: { title: string; confidence: number | null }[],
): Promise<string> {
  const { model, providerOptions } = await getChatModel();
  const list = related
    .map(
      (r, i) =>
        `${i + 1}. ${r.title}${r.confidence != null ? `（置信度 ${r.confidence}）` : ""}`,
    )
    .join("\n");
  const { text } = await generateText({
    model,
    providerOptions,
    system:
      "你是判断力训练助手。用一两句中文点出新判断与历史判断之间的关系——" +
      "是相互印证、补充，还是矛盾/打架。直接给结论，不要寒暄，不要复述原文。",
    prompt: `新判断：${newTitle}\n\n历史相关判断：\n${list}`,
  });
  return text.trim();
}

export async function testConnection(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const { model, providerOptions } = await getChatModel();
    const { text } = await generateText({
      model,
      providerOptions,
      prompt: "请只回复两个字：可以",
    });
    return { ok: true, message: `连接成功，模型回复：${text.trim().slice(0, 50)}` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}
