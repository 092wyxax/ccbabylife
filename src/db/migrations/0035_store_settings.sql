-- 設定中心（admin/settings）：全店營運參數。
-- 一個 org 一列；查無資料時程式以 src/lib/pricing.ts 常數為預設，毋須 seed。

CREATE TABLE "store_settings" (
	"org_id" uuid PRIMARY KEY NOT NULL,
	"bot_rate" numeric(8, 4) DEFAULT '0.225' NOT NULL,
	"free_ship_threshold_twd" integer DEFAULT 2000 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_email" text
);--> statement-breakpoint
ALTER TABLE "store_settings" ADD CONSTRAINT "store_settings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
