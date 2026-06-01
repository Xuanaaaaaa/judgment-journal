CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "judgments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"reasoning" text,
	"pre_mortem" text,
	"confidence" integer,
	"domain" text[] DEFAULT '{}'::text[] NOT NULL,
	"deadline" date,
	"review_interval_days" integer DEFAULT 90,
	"next_review_date" date,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"resolution_notes" text,
	"embedding" vector(1536),
	"raw_input" text,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "judgments_type_check" CHECK ("judgments"."type" in ('prediction', 'stance')),
	CONSTRAINT "judgments_confidence_check" CHECK ("judgments"."confidence" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "review_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judgment_id" uuid NOT NULL,
	"previous_confidence" integer,
	"new_confidence" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judgment_id" uuid NOT NULL,
	"result" varchar(10) NOT NULL,
	"notes" text,
	"evidence_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verification_result_check" CHECK ("verification_logs"."result" in ('correct', 'wrong'))
);
--> statement-breakpoint
ALTER TABLE "judgments" ADD CONSTRAINT "judgments_parent_id_judgments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."judgments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_judgment_id_judgments_id_fk" FOREIGN KEY ("judgment_id") REFERENCES "public"."judgments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_logs" ADD CONSTRAINT "verification_logs_judgment_id_judgments_id_fk" FOREIGN KEY ("judgment_id") REFERENCES "public"."judgments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_judgments_type" ON "judgments" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_judgments_status" ON "judgments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_judgments_deadline" ON "judgments" USING btree ("deadline") WHERE type = 'prediction';--> statement-breakpoint
CREATE INDEX "idx_judgments_next_review" ON "judgments" USING btree ("next_review_date") WHERE type = 'stance';--> statement-breakpoint
CREATE INDEX "idx_judgments_domain" ON "judgments" USING gin ("domain");--> statement-breakpoint
CREATE INDEX "idx_judgments_embedding" ON "judgments" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_review_logs_judgment" ON "review_logs" USING btree ("judgment_id");--> statement-breakpoint
CREATE INDEX "idx_verification_logs_judgment" ON "verification_logs" USING btree ("judgment_id");