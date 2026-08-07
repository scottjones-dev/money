DROP INDEX "income_sources_source_calculation_unique";--> statement-breakpoint
ALTER TABLE "income_sources" ADD COLUMN "source_calculation_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "income_sources_source_calculation_key_unique" ON "income_sources" ("source_calculation_id","source_calculation_key");