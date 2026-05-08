CREATE TABLE "member_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_jp" text,
	"color" text,
	"threshold_twd" integer DEFAULT 0 NOT NULL,
	"discount_bp" integer DEFAULT 0 NOT NULL,
	"free_ship_min_twd" integer,
	"birthday_bonus_twd" integer DEFAULT 0 NOT NULL,
	"perks" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "tier_id" uuid;--> statement-breakpoint
ALTER TABLE "member_tiers" ADD CONSTRAINT "member_tiers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "member_tiers_org_threshold_idx" ON "member_tiers" USING btree ("org_id","threshold_twd");