ALTER TABLE "coupons" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "per_user_limit" integer;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "applicable_product_ids" uuid[];--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "applicable_category_slugs" text[];--> statement-breakpoint
ALTER TABLE "coupons" ADD COLUMN "auto_issue_on" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
CREATE INDEX "coupons_auto_issue_idx" ON "coupons" USING btree ("auto_issue_on");