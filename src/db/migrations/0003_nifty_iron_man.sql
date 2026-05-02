CREATE TABLE "cleaned_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"raw_post_id" uuid,
	"source" text NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"mentioned_products" text[],
	"sentiment" text,
	"tags" text[],
	"embedding_hint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"platforms" jsonb,
	"monitored_keywords" text[],
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intelligence_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"summary" text NOT NULL,
	"recommendations" jsonb,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"raw_content" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "trends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"period" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"keyword" text NOT NULL,
	"source" text,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"sentiment_avg" integer,
	"change_pct" integer,
	"related_product_ids" uuid[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cleaned_data" ADD CONSTRAINT "cleaned_data_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cleaned_data" ADD CONSTRAINT "cleaned_data_raw_post_id_raw_posts_id_fk" FOREIGN KEY ("raw_post_id") REFERENCES "public"."raw_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intelligence_reports" ADD CONSTRAINT "intelligence_reports_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "raw_posts" ADD CONSTRAINT "raw_posts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trends" ADD CONSTRAINT "trends_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cleaned_data_org_idx" ON "cleaned_data" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "cleaned_data_source_idx" ON "cleaned_data" USING btree ("source");--> statement-breakpoint
CREATE INDEX "competitors_org_idx" ON "competitors" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "intelligence_reports_period_idx" ON "intelligence_reports" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "raw_posts_org_idx" ON "raw_posts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "raw_posts_source_idx" ON "raw_posts" USING btree ("source");--> statement-breakpoint
CREATE INDEX "raw_posts_fetched_idx" ON "raw_posts" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "trends_org_idx" ON "trends" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "trends_period_idx" ON "trends" USING btree ("period_start");--> statement-breakpoint
CREATE INDEX "trends_keyword_idx" ON "trends" USING btree ("keyword");