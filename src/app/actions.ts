"use server";

import { parseJudgment } from "@/lib/ai";
import { isValidIsoDate } from "@/lib/date";
import { createJudgment } from "@/lib/judgments";
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

export type CreateResult =
  | { ok: true; id: string }
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

  try {
    const id = await createJudgment({
      type,
      title,
      reasoning,
      preMortem,
      confidence,
      domain,
      deadline,
      reviewIntervalDays,
      rawInput,
    });
    return { ok: true, id };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "保存失败" };
  }
}
