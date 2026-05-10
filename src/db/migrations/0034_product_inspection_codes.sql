-- ROADMAP Tier 2 #11: deepen legal fields with structured inspection codes
-- so the public page can render clickable BSMI lookup links and SGS
-- report references.

ALTER TABLE "products" ADD COLUMN "bsmi_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sgs_report_no" text;--> statement-breakpoint
-- Optional supabase storage paths for uploaded inspection PDFs / photos
ALTER TABLE "products" ADD COLUMN "inspection_doc_paths" text[];
