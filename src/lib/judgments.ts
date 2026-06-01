import { todayLocal } from "./date";
import { db } from "./db";
import { judgments } from "./schema";

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
