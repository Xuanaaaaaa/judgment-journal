import { eq, sql } from "drizzle-orm";

import { db } from "./db";
import { appSettings } from "./schema";

export type AppSettings = typeof appSettings.$inferSelect;

const SINGLETON_ID = 1;

export async function getSettings(): Promise<AppSettings | null> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, SINGLETON_ID))
    .limit(1);
  return rows[0] ?? null;
}

type SaveInput = {
  provider: string;
  baseUrl: string | null;
  model: string | null;
  defaultReviewIntervalDays: number;
  // 留空表示保留已存 key（不覆盖）
  apiKey?: string | null;
};

export async function saveSettings(input: SaveInput): Promise<void> {
  const updateSet: Record<string, unknown> = {
    provider: input.provider,
    baseUrl: input.baseUrl,
    model: input.model,
    defaultReviewIntervalDays: input.defaultReviewIntervalDays,
    updatedAt: sql`now()`,
  };
  if (input.apiKey != null && input.apiKey !== "") {
    updateSet.apiKey = input.apiKey;
  }

  await db
    .insert(appSettings)
    .values({
      id: SINGLETON_ID,
      provider: input.provider,
      apiKey: input.apiKey ?? null,
      baseUrl: input.baseUrl,
      model: input.model,
      defaultReviewIntervalDays: input.defaultReviewIntervalDays,
    })
    .onConflictDoUpdate({ target: appSettings.id, set: updateSet });
}
