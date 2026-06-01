"use server";

import { parseJudgment, summarizeRelation } from "@/lib/ai";
import { isValidIsoDate } from "@/lib/date";
import { generateEmbedding, isEmbeddingConfigured } from "@/lib/embedding";
import {
  createJudgment,
  findRelated,
  type RelatedJudgment,
} from "@/lib/judgments";
import type { ParsedJudgment } from "@/lib/schemas";

export type ParseResult =
  | { ok: true; data: ParsedJudgment }
  | { ok: false; message: string };

export async function parseJudgmentAction(input: string): Promise<ParseResult> {
  const text = input.trim();
  if (!text) return { ok: false, message: "请输入内容" };
  try {
    return { ok: true, data: await parseJudgment(text) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "解析失败" };
  }
}

export type CreateSuccess = {
  ok: true;
  id: string;
  related: RelatedJudgment[];
  relationSummary: string | null;
};

export type CreateResult =
  | CreateSuccess
  | { ok: false; message: string }
  | null;

export async function createJudgmentAction(
  _prev: CreateResult,
  formData: FormData,
): Promise<CreateResult> {
  const type =
    String(formData.get("type")) === "stance" ? "stance" : "prediction";
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, message: "命题不能为空" };

  const reasoning = String(formData.get("reasoning") ?? "").trim() || null;
  const preMortem = String(formData.get("preMortem") ?? "").trim() || null;
  const rawInput = String(formData.get("rawInput") ?? "").trim() || null;

  let confidence: number | null = null;
  const confidenceRaw = String(formData.get("confidence") ?? "").trim();
  if (confidenceRaw !== "") {
    const n = Number(confidenceRaw);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return { ok: false, message: "置信度需为 0–100 的数字" };
    }
    confidence = Math.round(n);
  }

  const domain = String(formData.get("domain") ?? "")
    .split(/[,，\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // prediction 必须有合法截止日；stance 不带 deadline。
  let deadline: string | null = null;
  let reviewIntervalDays: number | null = null;
  if (type === "prediction") {
    deadline = String(formData.get("deadline") ?? "").trim();
    if (!deadline) return { ok: false, message: "预测需要填写验证截止日期" };
    if (!isValidIsoDate(deadline)) {
      return { ok: false, message: "截止日期格式应为 YYYY-MM-DD" };
    }
  } else {
    const n = Number(String(formData.get("reviewIntervalDays") ?? "").trim());
    if (!Number.isInteger(n) || n < 1) {
      return { ok: false, message: "复审周期需为不小于 1 的整数" };
    }
    reviewIntervalDays = n;
  }

  // 提交时生成 embedding：未配置或生成失败都不阻塞录入，仅跳过关联检索。
  let embedding: number[] | null = null;
  if (await isEmbeddingConfigured()) {
    try {
      embedding = await generateEmbedding(
        [title, reasoning, preMortem].filter(Boolean).join("\n"),
      );
    } catch (e) {
      console.error("生成 embedding 失败，跳过关联检索：", e);
    }
  }

  let id: string;
  try {
    id = await createJudgment({
      type,
      title,
      reasoning,
      preMortem,
      confidence,
      domain,
      deadline,
      reviewIntervalDays,
      rawInput,
      embedding,
    });
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "保存失败" };
  }

  // 关联检索 + AI 一句话总结：失败不影响录入成功，仅不展示关联。
  let related: RelatedJudgment[] = [];
  let relationSummary: string | null = null;
  if (embedding) {
    try {
      related = await findRelated(embedding, id);
      if (related.length > 0) {
        relationSummary = await summarizeRelation(title, related);
      }
    } catch (e) {
      console.error("关联检索失败：", e);
    }
  }

  return { ok: true, id, related, relationSummary };
}
