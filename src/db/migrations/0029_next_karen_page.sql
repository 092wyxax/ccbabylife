CREATE TABLE "line_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"line_user_id" text NOT NULL,
	"direction" text NOT NULL,
	"line_message_id" text,
	"type" text DEFAULT 'text' NOT NULL,
	"text" text,
	"raw" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "line_messages_line_message_id_unique" UNIQUE("line_message_id")
);
--> statement-breakpoint
ALTER TABLE "line_messages" ADD CONSTRAINT "line_messages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "line_msg_user_idx" ON "line_messages" USING btree ("line_user_id","created_at");--> statement-breakpoint
CREATE INDEX "line_msg_unread_idx" ON "line_messages" USING btree ("is_read","created_at");