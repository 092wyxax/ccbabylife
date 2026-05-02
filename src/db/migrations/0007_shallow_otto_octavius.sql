CREATE TABLE "experiment_exposures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"experiment_key" text NOT NULL,
	"variant_key" text NOT NULL,
	"visitor_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"variants" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experiment_exposures" ADD CONSTRAINT "experiment_exposures_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exp_exposures_exp_idx" ON "experiment_exposures" USING btree ("experiment_key","variant_key");--> statement-breakpoint
CREATE INDEX "exp_exposures_visitor_idx" ON "experiment_exposures" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "experiments_org_idx" ON "experiments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "experiments_key_idx" ON "experiments" USING btree ("key");