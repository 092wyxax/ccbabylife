CREATE TABLE "product_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"main_product_id" uuid NOT NULL,
	"addon_product_id" uuid NOT NULL,
	"addon_price_twd" integer NOT NULL,
	"max_addon_qty" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "threshold_gifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"threshold_twd" integer NOT NULL,
	"gift_product_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_main_product_id_products_id_fk" FOREIGN KEY ("main_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_addons" ADD CONSTRAINT "product_addons_addon_product_id_products_id_fk" FOREIGN KEY ("addon_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threshold_gifts" ADD CONSTRAINT "threshold_gifts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "threshold_gifts" ADD CONSTRAINT "threshold_gifts_gift_product_id_products_id_fk" FOREIGN KEY ("gift_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_addons_main_idx" ON "product_addons" USING btree ("main_product_id","is_active");--> statement-breakpoint
CREATE INDEX "threshold_gifts_org_idx" ON "threshold_gifts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "threshold_gifts_active_idx" ON "threshold_gifts" USING btree ("is_active","threshold_twd");