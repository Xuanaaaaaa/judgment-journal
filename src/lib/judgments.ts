import { and, arrayContains, desc, eq, lte, or, sql } from "drizzle-orm";

import { todayLocal } from "./date";
import { db } from "./db";
import { judgments } from "./schema";

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

export type ListFilters = {
  type?: string;
  status?: string;
  domain?: string;
};

// 主列表：按 type / status / domain 筛选，创建时间倒序。
export async function listJudgments(
  filters: ListFilters = {},
): Promise<JudgmentListItem[]> {
  const conds = [];
  if (filters.type) conds.push(eq(judgments.type, filters.type));
  if (filters.status) conds.push(eq(judgments.status, filters.status));
  if (filters.domain) conds.push(arrayContains(judgments.domain, [filters.domain]));

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
