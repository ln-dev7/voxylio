-- Pro tables/columns were historically deployed with `drizzle-kit push`.
-- Guards make this migration safe on that production shape and on a fresh DB.
CREATE TABLE IF NOT EXISTS "pro_usage" (
	"user_id" text NOT NULL,
	"period" text NOT NULL,
	"chars" integer DEFAULT 0 NOT NULL,
	"tts_chars" integer DEFAULT 0 NOT NULL,
	"audio_seconds" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pro_usage" ADD COLUMN IF NOT EXISTS "chars" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pro_usage" ADD COLUMN IF NOT EXISTS "tts_chars" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pro_usage" ADD COLUMN IF NOT EXISTS "audio_seconds" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pro_usage" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sdk_license" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"secret_hash" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"min_sdk_version" text DEFAULT '1.0.0' NOT NULL,
	"max_sdk_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_verified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sdk_license_domain" (
	"license_id" text NOT NULL,
	"domain" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sdk_license_rate_limit" (
	"subject_hash" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp DEFAULT now() NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'sdk_license_rate_limit'
			AND column_name = 'license_id'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'sdk_license_rate_limit'
			AND column_name = 'subject_hash'
	) THEN
		ALTER TABLE "sdk_license_rate_limit" RENAME COLUMN "license_id" TO "subject_hash";
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "entitlement" ADD COLUMN IF NOT EXISTS "trial_started_at" timestamp;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'sdk_license_domain_license_id_sdk_license_id_fk'
			AND conrelid = 'public.sdk_license_domain'::regclass
	) THEN
		ALTER TABLE "sdk_license_domain"
			ADD CONSTRAINT "sdk_license_domain_license_id_sdk_license_id_fk"
			FOREIGN KEY ("license_id") REFERENCES "public"."sdk_license"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pro_usage_user_period_idx" ON "pro_usage" USING btree ("user_id","period");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sdk_license_status_idx" ON "sdk_license" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sdk_license_domain_unique_idx" ON "sdk_license_domain" USING btree ("license_id","domain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sdk_license_domain_license_idx" ON "sdk_license_domain" USING btree ("license_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sdk_license_rate_limit_updated_idx" ON "sdk_license_rate_limit" USING btree ("updated_at");
