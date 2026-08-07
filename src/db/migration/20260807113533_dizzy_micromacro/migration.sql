CREATE TYPE "employment_type" AS ENUM('employment', 'self_employment');--> statement-breakpoint
CREATE TYPE "financial_record_kind" AS ENUM('household_facts', 'budget', 'repayment_plan', 'assessment');--> statement-breakpoint
CREATE TYPE "pension_type" AS ENUM('workplace_defined_contribution', 'workplace_defined_benefit', 'personal', 'sipp', 'state', 'other');--> statement-breakpoint
CREATE TYPE "uk_nation" AS ENUM('england', 'scotland', 'wales', 'northern_ireland');--> statement-breakpoint
ALTER TYPE "calculation_type" ADD VALUE 'payroll' BEFORE 'affordability';--> statement-breakpoint
ALTER TYPE "calculation_type" ADD VALUE 'childcare' BEFORE 'affordability';--> statement-breakpoint
ALTER TYPE "calculation_type" ADD VALUE 'child_maintenance' BEFORE 'affordability';--> statement-breakpoint
ALTER TYPE "calculation_type" ADD VALUE 'pension' BEFORE 'affordability';--> statement-breakpoint
ALTER TYPE "calculation_type" ADD VALUE 'assessment';--> statement-breakpoint
CREATE TABLE "employments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"type" "employment_type" NOT NULL,
	"name" text NOT NULL,
	"gross_annual_income" numeric(14,2) NOT NULL,
	"tax_code" text,
	"ni_category" text DEFAULT 'A' NOT NULL,
	"student_loan_plans" jsonb DEFAULT '[]' NOT NULL,
	"pension_contribution_percent" numeric(7,4),
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"kind" "financial_record_kind" NOT NULL,
	"name" text NOT NULL,
	"version" numeric(8,0) DEFAULT '1' NOT NULL,
	"payload_encrypted" text NOT NULL,
	"encryption_key_id" text NOT NULL,
	"summary" jsonb DEFAULT '{}' NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"type" "pension_type" NOT NULL,
	"name" text NOT NULL,
	"current_value" numeric(14,2) DEFAULT '0.00' NOT NULL,
	"personal_monthly_contribution" numeric(14,2) DEFAULT '0.00' NOT NULL,
	"employer_monthly_contribution" numeric(14,2) DEFAULT '0.00' NOT NULL,
	"retirement_age" numeric(3,0),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "debt_payments_idempotency_key_idx";--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "input_encrypted" text;--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "result_encrypted" text;--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "encryption_key_id" text;--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "warnings" jsonb;--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "committed_links" jsonb;--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "committed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "committed_by" text;--> statement-breakpoint
ALTER TABLE "calculations" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD COLUMN "reference_key_id" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "source_calculation_id" uuid;--> statement-breakpoint
ALTER TABLE "households" ADD COLUMN "nation" "uk_nation";--> statement-breakpoint
ALTER TABLE "income_sources" ADD COLUMN "source_calculation_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX "debt_payments_household_idempotency_unique" ON "debt_payments" ("household_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "expenses_source_calculation_unique" ON "expenses" ("source_calculation_id");--> statement-breakpoint
CREATE INDEX "employments_household_id_idx" ON "employments" ("household_id");--> statement-breakpoint
CREATE INDEX "employments_member_id_idx" ON "employments" ("member_id");--> statement-breakpoint
CREATE INDEX "financial_records_household_kind_idx" ON "financial_records" ("household_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_records_household_kind_name_version_unique" ON "financial_records" ("household_id","kind","name","version");--> statement-breakpoint
CREATE INDEX "pensions_household_id_idx" ON "pensions" ("household_id");--> statement-breakpoint
CREATE UNIQUE INDEX "income_sources_source_calculation_unique" ON "income_sources" ("source_calculation_id");--> statement-breakpoint
ALTER TABLE "employments" ADD CONSTRAINT "employments_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "employments" ADD CONSTRAINT "employments_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pensions" ADD CONSTRAINT "pensions_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "pensions" ADD CONSTRAINT "pensions_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE CASCADE;