CREATE TABLE "return_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"request_number" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"photo_paths" text[],
	"items_snapshot" jsonb,
	"refund_twd" integer,
	"internal_notes" text,
	"handled_by_id" uuid,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "return_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_handled_by_id_admin_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "returns_org_status_idx" ON "return_requests" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "returns_order_idx" ON "return_requests" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "returns_customer_idx" ON "return_requests" USING btree ("customer_id");