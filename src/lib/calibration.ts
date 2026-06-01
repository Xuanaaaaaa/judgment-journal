import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { db } from "./db";
import { judgments } from "./schema";

// 校准分析（纯代码，不需 LLM）。数据源 = judgments 主表的最终状态，
// 每条已验证预测只计一次（verification_logs 可能多次修正，不用于统计）。

// 已验证且填了置信度的预测：用于校准曲线与领域准确率。
const VERIFIED = ["verified_correct", "verified_wrong"];

export type CalibrationBucket = {
  label: string; // 如 "50-60"
  lo: number;
  hi: number;
  total: number;
  correct: number;
  accuracy: number | null; // total=0 时为 null
  meanConfidence: number | null; // 桶内样本平均置信度（X 轴用），total=0 时为 null
};

export type DomainAccuracy = {
  domain: string;
  total: number;
  correct: number;
  accuracy: number;
};

export type PendingOverview = {
  duePredictions: number; // 已到期待验证
  dueStances: number; // 已到复审日
};

export type DashboardData = {
  buckets: CalibrationBucket[];
  domains: DomainAccuracy[];
  pending: PendingOverview;
  verifiedCount: number; // 纳入校准的样本数
};

// 置信度分桶边界：[50,60),[60,70),[70,80),[80,90),[90,100]。
// <50 不入桶——二元预测里置信度应 ≥50（否则该反向陈述命题）。
const BUCKETS: { label: string; lo: number; hi: number }[] = [
  { label: "50-60", lo: 50, hi: 60 },
  { label: "60-70", lo: 60, hi: 70 },
  { label: "70-80", lo: 70, hi: 80 },
  { label: "80-90", lo: 80, hi: 90 },
  { label: "90-100", lo: 90, hi: 100 },
];

function bucketIndex(confidence: number): number {
  if (confidence < 50) return -1;
  if (confidence >= 100) return BUCKETS.length - 1; // 100 归入最后一桶
  return Math.min(Math.floor((confidence - 50) / 10), BUCKETS.length - 1);
}

export async function getDashboardData(): Promise<DashboardData> {
  // 1) 取所有已验证、且置信度非空的预测（仅需 confidence/status/domain）。
  const rows = await db
    .select({
      confidence: judgments.confidence,
      status: judgments.status,
      domain: judgments.domain,
    })
    .from(judgments)
    .where(
      and(
        eq(judgments.type, "prediction"),
        inArray(judgments.status, VERIFIED),
        isNotNull(judgments.confidence),
      ),
    );

  // 2) 校准分桶。
  const buckets: CalibrationBucket[] = BUCKETS.map((b) => ({
    ...b,
    total: 0,
    correct: 0,
    accuracy: null,
    meanConfidence: null,
  }));
  const confidenceSum = new Array(buckets.length).fill(0);
  // 3) 领域准确率（一条预测可属多个领域，各计一次；同条内重复标签去重）。
  const domainMap = new Map<string, { total: number; correct: number }>();

  let verifiedCount = 0; // 纳入校准曲线的样本数（仅入桶的，即 confidence ≥ 50）。
  for (const r of rows) {
    if (r.confidence == null) continue;
    const isCorrect = r.status === "verified_correct";
    const bi = bucketIndex(r.confidence);
    if (bi >= 0) {
      buckets[bi].total += 1;
      if (isCorrect) buckets[bi].correct += 1;
      confidenceSum[bi] += r.confidence;
      verifiedCount += 1;
    }
    for (const d of new Set(r.domain)) {
      const cur = domainMap.get(d) ?? { total: 0, correct: 0 };
      cur.total += 1;
      if (isCorrect) cur.correct += 1;
      domainMap.set(d, cur);
    }
  }
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i];
    b.accuracy = b.total > 0 ? b.correct / b.total : null;
    b.meanConfidence = b.total > 0 ? confidenceSum[i] / b.total : null;
  }
  const domains: DomainAccuracy[] = [...domainMap.entries()]
    .map(([domain, v]) => ({
      domain,
      total: v.total,
      correct: v.correct,
      accuracy: v.correct / v.total,
    }))
    .sort((a, b) => b.total - a.total);

  // 4) 待处理概览（与判断库待处理区同口径）。
  const today = sql`current_date`;
  const [pendingRow] = await db
    .select({
      duePredictions: sql<number>`count(*) filter (where ${judgments.type} = 'prediction' and ${judgments.status} = 'pending' and ${judgments.deadline} <= ${today})`,
      dueStances: sql<number>`count(*) filter (where ${judgments.type} = 'stance' and ${judgments.status} = 'active' and ${judgments.nextReviewDate} <= ${today})`,
    })
    .from(judgments);

  return {
    buckets,
    domains,
    pending: {
      duePredictions: Number(pendingRow?.duePredictions ?? 0),
      dueStances: Number(pendingRow?.dueStances ?? 0),
    },
    verifiedCount,
  };
}
