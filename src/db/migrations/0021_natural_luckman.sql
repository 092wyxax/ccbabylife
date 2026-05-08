CREATE TABLE "cart_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"customer_id" uuid,
	"email" text,
	"items" jsonb NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"subtotal_twd" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"recovery_pushed_at" timestamp with time zone,
	"recovered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_snapshots" ADD CONSTRAINT "cart_snapshots_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_snapshots" ADD CONSTRAINT "cart_snapshots_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cart_snapshots_customer_idx" ON "cart_snapshots" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cart_snapshots_email_idx" ON "cart_snapshots" USING btree ("email");--> statement-breakpoint
CREATE INDEX "cart_snapshots_updated_idx" ON "cart_snapshots" USING btree ("updated_at");