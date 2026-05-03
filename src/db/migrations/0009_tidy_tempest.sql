CREATE TABLE "trending_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"week_started_at" timestamp with time zone NOT NULL,
	"rank" integer NOT NULL,
	"source" text NOT NULL,
	"source_url" text,
	"name_jp" text NOT NULL,
	"name_zh" text NOT NULL,
	"price_jpy" integer,
	"image_url" text,
	"category" text,
	"our_product_slug" text,
	"availability" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trending_products" ADD CONSTRAINT "trending_products_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trending_org_week_idx" ON "trending_products" USING btree ("org_id","week_started_at");--> statement-breakpoint
CREATE INDEX "trending_rank_idx" ON "trending_products" USING btree ("week_started_at","rank");