import { db } from "./db";
import { judgments, reviewLogs, verificationLogs } from "./schema";

// 数据导出：仅三张业务表。显式排除 embedding 向量（巨大、无意义）；
// 绝不含 app_settings（存有 API key）。
const judgmentExportColumns = {
  id: judgments.id,
  type: judgments.type,
  title: judgments.title,
  reasoning: judgments.reasoning,
  preMortem: judgments.preMortem,
  confidence: judgments.confidence,
  domain: judgments.domain,
  deadline: judgments.deadline,
  reviewIntervalDays: judgments.reviewIntervalDays,
  nextReviewDate: judgments.nextReviewDate,
  status: judgments.status,
  resolutionNotes: judgments.resolutionNotes,
  rawInput: judgments.rawInput,
  parentId: judgments.parentId,
  createdAt: judgments.createdAt,
  updatedAt: judgments.updatedAt,
};

export async function exportData() {
  const [judgmentRows, reviewRows, verificationRows] = await Promise.all([
    db.select(judgmentExportColumns).from(judgments),
    db.select().from(reviewLogs),
    db.select().from(verificationLogs),
  ]);
  return {
    judgments: judgmentRows,
    reviewLogs: reviewRows,
    verificationLogs: verificationRows,
  };
}
