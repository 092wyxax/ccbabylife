CREATE TABLE "push_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"customer_id" uuid,
	"channel" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"template_id" text,
	"subject" text,
	"body" text NOT NULL,
	"payload" jsonb,
	"error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "push_logs" ADD CONSTRAINT "push_logs_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_logs" ADD CONSTRAINT "push_logs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "push_logs_org_idx" ON "push_logs" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "push_logs_customer_idx" ON "push_logs" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "push_logs_status_idx" ON "push_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "push_logs_created_idx" ON "push_logs" USING btree ("created_at");