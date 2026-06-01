CREATE TABLE "app_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"provider" varchar(30) DEFAULT 'openai-compatible' NOT NULL,
	"api_key" text,
	"base_url" text,
	"model" text,
	"default_review_interval_days" integer DEFAULT 90 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_singleton" CHECK ("app_settings"."id" = 1)
);
