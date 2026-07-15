ALTER TABLE "accounts" ADD COLUMN "pending_username" text;--> statement-breakpoint
CREATE INDEX "accounts_pending_username_index" ON "accounts" USING btree (lower("pending_username"));