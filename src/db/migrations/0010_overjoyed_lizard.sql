CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" text DEFAULT 'other' NOT NULL,
	"strengths" text,
	"status" text DEFAULT 'active' NOT NULL,
	"rating" integer,
	"categories" text[],
	"payment_methods" text[],
	"needs_membership" boolean DEFAULT false NOT NULL,
	"ships_overseas" boolean DEFAULT false NOT NULL,
	"notes" text,
	"last_ordered_at" timestamp with time zone,
	"avg_processing_days" integer,
	"avg_order_jpy" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sources_org_idx" ON "sources" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "sources_status_idx" ON "sources" USING btree ("status");