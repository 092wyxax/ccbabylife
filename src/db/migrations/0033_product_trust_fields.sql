-- ROADMAP Tier 1 #1, #2, #3: 5-section legal labels, 14-day trial structure,
-- not-suitable-for reverse list. Old single-text columns (legal_notes,
-- use_experience) stay as legacy fallback.

ALTER TABLE "products" ADD COLUMN "legal_chinese_label" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "legal_category" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "legal_shop_promise" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "legal_shop_limits" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "legal_return_note" text;--> statement-breakpoint

ALTER TABLE "products" ADD COLUMN "trial_day_1" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "trial_day_7" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "trial_day_14" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "trial_pros" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "trial_cons" text[];--> statement-breakpoint
-- 0–50 representing 0.0–5.0 stars in 0.1 steps. NULL = no rating.
ALTER TABLE "products" ADD COLUMN "trial_rating" integer;--> statement-breakpoint

ALTER TABLE "products" ADD COLUMN "not_suitable_for" text[];
