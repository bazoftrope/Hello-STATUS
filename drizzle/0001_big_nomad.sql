ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_entry_id_entries_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_log" ADD COLUMN "entry_user_id" uuid NOT NULL;