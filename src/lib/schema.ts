import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  vector,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Embedding 向量维度：固定 1536（百炼 text-embedding-v4 / Qwen3-Embedding 均支持该维度）。
// 单一来源，runtime 生成向量与建表列共用此常量，避免分歧。
// 换 embedding 模型导致维度变化时：改此常量 + 重新生成执行 migration + 全量 re-embed。
export const EMBEDDING_DIMENSIONS = 1536;

// 判断主表
export const judgments = pgTable(
  "judgments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 20 }).notNull(), // 'prediction' | 'stance'
    title: text("title").notNull(), // 一句话命题
    reasoning: text("reasoning"), // 详细理由
    preMortem: text("pre_mortem"), // "如果错了最可能因为什么"
    confidence: integer("confidence"), // 0-100 置信度
    domain: text("domain")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`), // 领域标签数组

    // 预测类专用
    deadline: date("deadline"), // 验证截止日期

    // 认知立场类专用
    reviewIntervalDays: integer("review_interval_days").default(90), // 复审周期（天）
    nextReviewDate: date("next_review_date"), // 下次复审日期

    // 状态
    // prediction: pending / verified_correct / verified_wrong / expired / withdrawn
    // stance: active / abandoned
    status: varchar("status", { length: 30 }).notNull().default("pending"),
    resolutionNotes: text("resolution_notes"), // 验证/最终复盘文字

    // AI 相关
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }), // 语义检索向量
    rawInput: text("raw_input"), // 用户原始自然语言输入

    // 扩展预留：未来支持判断层级结构
    parentId: uuid("parent_id").references((): AnyPgColumn => judgments.id),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_judgments_type").on(t.type),
    index("idx_judgments_status").on(t.status),
    index("idx_judgments_deadline")
      .on(t.deadline)
      .where(sql`type = 'prediction'`),
    index("idx_judgments_next_review")
      .on(t.nextReviewDate)
      .where(sql`type = 'stance'`),
    index("idx_judgments_domain").using("gin", t.domain),
    index("idx_judgments_embedding").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
    check("judgments_type_check", sql`${t.type} in ('prediction', 'stance')`),
    check(
      "judgments_confidence_check",
      sql`${t.confidence} between 0 and 100`,
    ),
  ],
);

// 复审记录表（认知立场专用）
export const reviewLogs = pgTable(
  "review_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judgmentId: uuid("judgment_id")
      .notNull()
      .references(() => judgments.id, { onDelete: "cascade" }),
    previousConfidence: integer("previous_confidence"),
    newConfidence: integer("new_confidence"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("idx_review_logs_judgment").on(t.judgmentId)],
);

// 验证记录表（预测类专用）
export const verificationLogs = pgTable(
  "verification_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    judgmentId: uuid("judgment_id")
      .notNull()
      .references(() => judgments.id, { onDelete: "cascade" }),
    result: varchar("result", { length: 10 }).notNull(), // 'correct' | 'wrong'
    notes: text("notes"),
    evidenceSource: text("evidence_source"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_verification_logs_judgment").on(t.judgmentId),
    check("verification_result_check", sql`${t.result} in ('correct', 'wrong')`),
  ],
);

// 应用配置（单用户，单行表：id 恒为 1）
export const appSettings = pgTable(
  "app_settings",
  {
    id: integer("id").primaryKey().default(1),
    // 对话/解析 provider：'anthropic' | 'openai' | 'openai-compatible'
    provider: varchar("provider", { length: 30 })
      .notNull()
      .default("openai-compatible"),
    apiKey: text("api_key"), // 明文存储（单用户本地工具；仅服务端使用）
    baseUrl: text("base_url"), // 仅 openai-compatible 需要
    model: text("model"),
    // Embedding provider（独立于对话模型；OpenAI 兼容 /embeddings）。
    // 一经选定不可随意换：换模型 = 全量 re-embed + 维度变化时改列。
    embeddingBaseUrl: text("embedding_base_url"),
    embeddingModel: text("embedding_model"),
    embeddingApiKey: text("embedding_api_key"),
    defaultReviewIntervalDays: integer("default_review_interval_days")
      .notNull()
      .default(90),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check("app_settings_singleton", sql`${t.id} = 1`)],
);
