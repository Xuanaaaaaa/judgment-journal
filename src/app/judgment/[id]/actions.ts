"use server";

import { revalidatePath } from "next/cache";

import {
  abandonStance,
  isUuid,
  reviewStance,
  verifyPrediction,
} from "@/lib/judgments";

export type ActionResult = { ok: boolean; message: string } | null;

// 校验 FormData 里的 id 是合法 UUID，非法返回 null。
function parseId(formData: FormData): string | null {
  const id = String(formData.get("id") ?? "").trim();
  return isUuid(id) ? id : null;
}

function revalidate(id: string) {
  revalidatePath(`/judgment/${id}`);
  revalidatePath("/library");
}

export async function verifyPredictionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = parseId(formData);
  if (!id) return { ok: false, message: "判断 ID 非法" };
  const result = String(formData.get("result") ?? "");
  if (result !== "correct" && result !== "wrong") {
    return { ok: false, message: "请选择验证结果" };
  }
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const evidenceSource =
    String(formData.get("evidenceSource") ?? "").trim() || null;
  try {
    await verifyPrediction({ id, result, notes, evidenceSource });
    revalidate(id);
    return { ok: true, message: "已记录验证结果" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "操作失败" };
  }
}

export async function reviewStanceAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = parseId(formData);
  if (!id) return { ok: false, message: "判断 ID 非法" };
  const raw = String(formData.get("newConfidence") ?? "").trim();
  if (raw === "") return { ok: false, message: "请填写新的置信度" };
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 100) {
    return { ok: false, message: "新置信度需为 0–100 的整数" };
  }
  const notes = String(formData.get("notes") ?? "").trim() || null;
  try {
    await reviewStance({ id, newConfidence: n, notes });
    revalidate(id);
    return { ok: true, message: "已记录复审" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "操作失败" };
  }
}

export async function abandonStanceAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const id = parseId(formData);
  if (!id) return { ok: false, message: "判断 ID 非法" };
  const notes = String(formData.get("notes") ?? "").trim() || null;
  try {
    await abandonStance({ id, notes });
    revalidate(id);
    return { ok: true, message: "已标记放弃" };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "操作失败" };
  }
}
