-- Drop the previous rhythm_completions table (had string taskId pointing
-- at hardcoded constants; just deployed, no real data to preserve).
DROP TABLE IF EXISTS "rhythm_completions";
--> statement-breakpoint

-- Editable tasks table
CREATE TABLE "rhythm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"role" text NOT NULL,
	"cadence" text NOT NULL,
	"weekday" integer,
	"sort" integer DEFAULT 0 NOT NULL,
	"label" text NOT NULL,
	"hint" text,
	"time_hint" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rhythm_tasks" ADD CONSTRAINT "rhythm_tasks_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rhythm_tasks_org_role_idx" ON "rhythm_tasks" USING btree ("org_id","role","is_active");
--> statement-breakpoint

-- Recreate completions with uuid FK to tasks
CREATE TABLE "rhythm_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rhythm_completions" ADD CONSTRAINT "rhythm_completions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rhythm_completions" ADD CONSTRAINT "rhythm_completions_admin_id_admin_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rhythm_completions" ADD CONSTRAINT "rhythm_completions_task_id_rhythm_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."rhythm_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rhythm_unique_idx" ON "rhythm_completions" USING btree ("admin_id","task_id","period_start");--> statement-breakpoint
CREATE INDEX "rhythm_period_idx" ON "rhythm_completions" USING btree ("org_id","period_start");
--> statement-breakpoint

-- Seed PLAYBOOK §3-§5 tasks for DEFAULT_ORG_ID
INSERT INTO "rhythm_tasks" ("org_id", "role", "cadence", "weekday", "sort", "label", "time_hint", "hint") VALUES
('00000000-0000-0000-0000-000000000001','content','daily',NULL,1,'Threads 早晚各 1 則 + 客服回覆','每日早晚','PLAYBOOK §3 — 每日 30–60 分鐘'),
('00000000-0000-0000-0000-000000000001','content','daily',NULL,2,'Threads 留 20–30 則他人留言','每日 30 分鐘','漲粉主引擎，鎖定母嬰 / 寵物 / 日本旅遊大帳'),
('00000000-0000-0000-0000-000000000001','content','weekly',1,10,'LINE 訂單通知（自動 + 個別補充）','週一早上',NULL),
('00000000-0000-0000-0000-000000000001','content','weekly',1,11,'寫 IG 限動 1 則「本週開團」','週一下午',NULL),
('00000000-0000-0000-0000-000000000001','content','weekly',2,20,'寫 1 篇深度 IG 貼文（試用 Day 1/7/14）','週二',NULL),
('00000000-0000-0000-0000-000000000001','content','weekly',3,30,'Threads 重點互動日（留 30 則他人留言）','週三',NULL),
('00000000-0000-0000-0000-000000000001','content','weekly',4,40,'寫 1 篇 Journal SEO 文章半成品','週四','可丟外包寫手，目標 25 篇 / 6 個月'),
('00000000-0000-0000-0000-000000000001','content','weekly',5,50,'LINE OA 群發訊息（每週 1 次）','週五','4 育兒 ：3 上新 ：2 法規 ：1 限時'),
('00000000-0000-0000-0000-000000000001','content','weekly',6,60,'包裝 + 手寫感謝卡','週六',NULL),
('00000000-0000-0000-0000-000000000001','content','weekly',7,70,'LINE 推「截單倒數 3 小時」','週日 21:00',NULL),
('00000000-0000-0000-0000-000000000001','system','weekly',1,10,'統整訂單 → 給朋友採購清單','週一',NULL),
('00000000-0000-0000-0000-000000000001','system','weekly',2,20,'處理上週退換貨、客服複雜案','週二',NULL),
('00000000-0000-0000-0000-000000000001','system','weekly',3,30,'開發新功能（依 ROADMAP 優先級）','週三',NULL),
('00000000-0000-0000-0000-000000000001','system','weekly',4,40,'開發新功能（接續週三）','週四',NULL),
('00000000-0000-0000-0000-000000000001','system','weekly',5,50,'出貨準備（標籤、託運單）','週五',NULL),
('00000000-0000-0000-0000-000000000001','system','weekly',6,60,'商品入庫 + 拍照','週六',NULL),
('00000000-0000-0000-0000-000000000001','system','weekly',7,70,'數據檢視 + 下週規劃','週日',NULL),
('00000000-0000-0000-0000-000000000001','sourcing','weekly',1,10,'收到清單 → 確認在日本 / 線上下單','週一',NULL),
('00000000-0000-0000-0000-000000000001','sourcing','weekly',2,20,'日本端採購、集運監控','週二–五',NULL),
('00000000-0000-0000-0000-000000000001','sourcing','weekly',6,30,'準備下週新品建議','週末',NULL);
