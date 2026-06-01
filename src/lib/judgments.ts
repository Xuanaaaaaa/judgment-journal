import {
  and,
  arrayContains,
  desc,
  eq,
  isNotNull,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { todayLocal } from "./date";
import { db } from "./db";
import { judgments, reviewLogs, verificationLogs } from "./schema";

// 列表展示用列（不取 embedding 向量，避免传输开销）。
const listColumns = {
  id: judgments.id,
  type: judgments.type,
  title: judgments.title,
  domain: judgments.domain,
  confidence: judgments.confidence,
  status: judgments.status,
  deadline: judgments.deadline,
  nextReviewDate: judgments.nextReviewDate,
  createdAt: judgments.createdAt,
};

export type JudgmentListItem = {
  id: string;
  type: string;
  title: string;
  domain: string[];
  confidence: number | null;
  status: string;
  deadline: string | null;
  nextReviewDate: string | null;
  createdAt: Date;
};

export type CreateJudgmentInput = {
  type: "prediction" | "stance";
  title: string;
  reasoning: string | null;
  preMortem: string | null;
  confidence: number | null;
  domain: string[];
  deadline: string | null; // YYYY-MM-DD，仅 prediction
  reviewIntervalDays: number | null; // 仅 stance
  rawInput: string | null;
  embedding: number[] | null; // 语义检索向量；未配置 embedding 时为 null
};

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function createJudgment(input: CreateJudgmentInput): Promise<string> {
  const isStance = input.type === "stance";
  const interval = input.reviewIntervalDays ?? 90;
  const today = todayLocal();

  const [row] = await db
    .insert(judgments)
    .values({
      type: input.type,
      title: input.title,
      reasoning: input.reasoning,
      preMortem: input.preMortem,
      confidence: input.confidence,
      domain: input.domain,
      deadline: isStance ? null : input.deadline,
      reviewIntervalDays: isStance ? interval : null,
      nextReviewDate: isStance ? addDays(today, interval) : null,
      status: isStance ? "active" : "pending",
      rawInput: input.rawInput,
      embedding: input.embedding,
    })
    .returning({ id: judgments.id });

  return row.id;
}

// 待处理：已到期待验证的预测 + 已到复审日的认知立场。驱动闭环，不受筛选影响。
export async function listPending(): Promise<JudgmentListItem[]> {
  const today = todayLocal();
  return db
    .select(listColumns)
    .from(judgments)
    .where(
      or(
        and(
          eq(judgments.type, "prediction"),
          eq(judgments.status, "pending"),
          lte(judgments.deadline, today),
        ),
        and(
          eq(judgments.type, "stance"),
          eq(judgments.status, "active"),
          lte(judgments.nextReviewDate, today),
        ),
      ),
    )
    .orderBy(sql`coalesce(${judgments.deadline}, ${judgments.nextReviewDate}) asc`);
}

// 到期提醒（design §5.4）：超过 deadline 满 30 天仍未验证的预测自动标记 expired。
// 本工具无常驻 cron，在页面加载时延惰调用。UPDATE 幂等，多页面重复调用无副作用。
const AUTO_EXPIRE_DAYS = 30;

export async function expireStalePredictions(): Promise<number> {
  const cutoff = addDays(todayLocal(), -AUTO_EXPIRE_DAYS);
  const rows = await db
    .update(judgments)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(judgments.type, "prediction"),
        eq(judgments.status, "pending"),
        lt(judgments.deadline, cutoff),
      ),
    )
    .returning({ id: judgments.id });
  return rows.length;
}

export type ListFilters = {
  type?: string;
  status?: string;
  domain?: string;
  due?: boolean; // 仅看已到期/到复审日的（与待处理区同口径，配合 type 使用）
};

// 主列表：按 type / status / domain 筛选，创建时间倒序。
export async function listJudgments(
  filters: ListFilters = {},
): Promise<JudgmentListItem[]> {
  const conds = [];
  if (filters.type) conds.push(eq(judgments.type, filters.type));
  if (filters.status) conds.push(eq(judgments.status, filters.status));
  if (filters.domain) conds.push(arrayContains(judgments.domain, [filters.domain]));
  if (filters.due) {
    const today = todayLocal();
    if (filters.type === "prediction") {
      conds.push(lte(judgments.deadline, today));
    } else if (filters.type === "stance") {
      conds.push(lte(judgments.nextReviewDate, today));
    }
  }

  return db
    .select(listColumns)
    .from(judgments)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(judgments.createdAt));
}

// 现有判断中出现过的领域标签（去重、排序），用于筛选下拉。
export async function listDomains(): Promise<string[]> {
  const rows = await db.execute<{ d: string }>(
    sql`select distinct unnest(domain) as d from judgments order by d`,
  );
  return rows.map((r) => r.d);
}

export type RelatedJudgment = {
  id: string;
  type: string;
  title: string;
  confidence: number | null;
  status: string;
  createdAt: Date;
  similarity: number; // 余弦相似度 0–1
};

// 余弦相似度阈值：低于此值视为不相关，不展示。
const SIMILARITY_THRESHOLD = 0.5;

// 关联检索：用查询向量在 pgvector 中找余弦最近的历史判断（排除自身），过阈值后返回。
export async function findRelated(
  vector: number[],
  excludeId: string,
  limit = 5,
): Promise<RelatedJudgment[]> {
  const vec = `[${vector.join(",")}]`;
  const rows = await db
    .select({
      id: judgments.id,
      type: judgments.type,
      title: judgments.title,
      confidence: judgments.confidence,
      status: judgments.status,
      createdAt: judgments.createdAt,
      similarity: sql<number>`1 - (${judgments.embedding} <=> ${vec}::vector)`,
    })
    .from(judgments)
    .where(
      and(
        isNotNull(judgments.embedding),
        ne(judgments.id, excludeId),
      ),
    )
    .orderBy(sql`${judgments.embedding} <=> ${vec}::vector`)
    .limit(limit);

  return rows.filter((r) => r.similarity >= SIMILARITY_THRESHOLD);
}

export type JudgmentDetail = typeof judgments.$inferSelect;
export type VerificationLog = typeof verificationLogs.$inferSelect;
export type ReviewLog = typeof reviewLogs.$inferSelect;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

// 详情：取整行。id 非法（非 uuid 语法）时返回 undefined，由调用方 notFound()。
// 注意：不 catch 查询本身——真实 DB 故障应当抛出，不能误当成「不存在」。
export async function getJudgment(
  id: string,
): Promise<JudgmentDetail | undefined> {
  if (!isUuid(id)) return undefined;
  const [row] = await db
    .select()
    .from(judgments)
    .where(eq(judgments.id, id))
    .limit(1);
  return row;
}

export async function getVerificationLogs(
  judgmentId: string,
): Promise<VerificationLog[]> {
  return db
    .select()
    .from(verificationLogs)
    .where(eq(verificationLogs.judgmentId, judgmentId))
    .orderBy(desc(verificationLogs.createdAt));
}

export async function getReviewLogs(judgmentId: string): Promise<ReviewLog[]> {
  return db
    .select()
    .from(reviewLogs)
    .where(eq(reviewLogs.judgmentId, judgmentId))
    .orderBy(desc(reviewLogs.createdAt));
}

// 验证预测：写 verification_logs + 更新主表状态/复盘笔记（事务保证一致）。
// 仅对 status=pending 的 prediction 生效，否则报错。
export async function verifyPrediction(input: {
  id: string;
  result: "correct" | "wrong";
  notes: string | null;
  evidenceSource: string | null;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [j] = await tx
      .select({ type: judgments.type, status: judgments.status })
      .from(judgments)
      .where(eq(judgments.id, input.id))
      .limit(1)
      .for("update");
    if (!j) throw new Error("判断不存在");
    if (j.type !== "prediction") throw new Error("只有预测可以验证对错");
    if (j.status !== "pending") throw new Error("该预测已验证或已关闭");

    await tx.insert(verificationLogs).values({
      judgmentId: input.id,
      result: input.result,
      notes: input.notes,
      evidenceSource: input.evidenceSource,
    });
    await tx
      .update(judgments)
      .set({
        status: input.result === "correct" ? "verified_correct" : "verified_wrong",
        resolutionNotes: input.notes,
        updatedAt: new Date(),
      })
      .where(eq(judgments.id, input.id));
  });
}

// 复审认知立场：写 review_logs（记录前后置信度）+ 更新 confidence 与下次复审日。
export async function reviewStance(input: {
  id: string;
  newConfidence: number;
  notes: string | null;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [j] = await tx
      .select({
        type: judgments.type,
        status: judgments.status,
        confidence: judgments.confidence,
        reviewIntervalDays: judgments.reviewIntervalDays,
      })
      .from(judgments)
      .where(eq(judgments.id, input.id))
      .limit(1)
      .for("update");
    if (!j) throw new Error("判断不存在");
    if (j.type !== "stance") throw new Error("只有认知立场可以复审");
    if (j.status !== "active") throw new Error("该立场已放弃");

    await tx.insert(reviewLogs).values({
      judgmentId: input.id,
      previousConfidence: j.confidence,
      newConfidence: input.newConfidence,
      notes: input.notes,
    });
    const interval = j.reviewIntervalDays ?? 90;
    await tx
      .update(judgments)
      .set({
        confidence: input.newConfidence,
        nextReviewDate: addDays(todayLocal(), interval),
        updatedAt: new Date(),
      })
      .where(eq(judgments.id, input.id));
  });
}

// 放弃认知立场：status→abandoned，备注存 resolution_notes。
export async function abandonStance(input: {
  id: string;
  notes: string | null;
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [j] = await tx
      .select({ type: judgments.type, status: judgments.status })
      .from(judgments)
      .where(eq(judgments.id, input.id))
      .limit(1)
      .for("update");
    if (!j) throw new Error("判断不存在");
    if (j.type !== "stance") throw new Error("只有认知立场可以放弃");
    if (j.status !== "active") throw new Error("该立场已放弃");

    await tx
      .update(judgments)
      .set({
        status: "abandoned",
        resolutionNotes: input.notes,
        nextReviewDate: null,
        updatedAt: new Date(),
      })
      .where(eq(judgments.id, input.id));
  });
}
