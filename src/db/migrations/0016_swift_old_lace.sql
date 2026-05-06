ALTER TABLE "purchase_items" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "tax_rate_group_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "name_zh" text;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "name_jp" text;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "spec" text;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "jpy_subtotal" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "twd_subtotal" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "import_duty" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "promo_fee" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "vat" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "clearance_fee_share" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "packaging_fee_share" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "agent_fee_share" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "landed_cost_per_unit" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "suggested_price_raw" integer;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD COLUMN "suggested_price" integer;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "purchase_date" date;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "exchange_rate_scaled" integer;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "twd_total" integer;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "agent_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "clearance_fee_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "packaging_fee_total" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "payment_method_id" uuid;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "markup_rate_bp" integer DEFAULT 3000 NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "price_round_strategy" text DEFAULT 'B' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_tax_rate_group_id_tax_rate_groups_id_fk" FOREIGN KEY ("tax_rate_group_id") REFERENCES "public"."tax_rate_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_agent_plan_id_agent_service_plans_id_fk" FOREIGN KEY ("agent_plan_id") REFERENCES "public"."agent_service_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_clearance_fee_plan_id_clearance_fee_plans_id_fk" FOREIGN KEY ("clearance_fee_plan_id") REFERENCES "public"."clearance_fee_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;