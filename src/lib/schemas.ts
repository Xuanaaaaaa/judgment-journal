import { z } from "zod";

// AI 解析输出 schema（用于 generateObject）。
// 注意：不含 confidence —— 置信度必须由用户自己填，AI 不代填。
export const parsedJudgmentSchema = z.object({
  type: z
    .enum(["prediction", "stance"])
    .describe("有明确时间锚点/截止日期的归 prediction，否则归 stance"),
  title: z.string().describe("一句话、可验证的命题"),
  reasoning: z.string().nullable().describe("支撑判断的理由，没有则 null"),
  preMortem: z
    .string()
    .nullable()
    .describe("如果这个判断错了，最可能的原因是什么，没有则 null"),
  domain: z.array(z.string()).describe("领域标签，如 [\"投资\", \"科技\"]，无则空数组"),
  deadline: z
    .string()
    .nullable()
    .describe("prediction 的验证截止日期，格式 YYYY-MM-DD；stance 或无法确定则 null"),
  reviewIntervalDays: z
    .number()
    .int()
    .nullable()
    .describe("stance 的复审周期（天），默认 90；prediction 则 null"),
});

export type ParsedJudgment = z.infer<typeof parsedJudgmentSchema>;
