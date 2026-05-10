CREATE TABLE "rhythm_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"task_id" text NOT NULL,
	"period_start" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rhythm_completions" ADD CONSTRAINT "rhythm_completions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rhythm_completions" ADD CONSTRAINT "rhythm_completions_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rhythm_unique_idx" ON "rhythm_completions" USING btree ("admin_id","task_id","period_start");--> statement-breakpoint
CREATE INDEX "rhythm_period_idx" ON "rhythm_completions" USING btree ("org_id","period_start");
