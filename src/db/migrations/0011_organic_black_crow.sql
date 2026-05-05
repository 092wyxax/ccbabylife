ALTER TABLE "admin_users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;
--> statement-breakpoint
UPDATE "admin_users" SET "role" = 'manager' WHERE "role" = 'admin';
--> statement-breakpoint
UPDATE "admin_users" SET "role" = 'buyer' WHERE "role" = 'partner';
