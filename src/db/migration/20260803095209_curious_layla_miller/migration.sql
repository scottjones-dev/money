CREATE TYPE "asset_ownership_type" AS ENUM('individual', 'joint', 'household');--> statement-breakpoint
CREATE TYPE "asset_type" AS ENUM('cash', 'current_account', 'savings_account', 'investment', 'pension', 'property', 'vehicle', 'business', 'valuable', 'other');--> statement-breakpoint
CREATE TYPE "calculation_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "calculation_type" AS ENUM('income_tax', 'national_insurance', 'student_loan', 'universal_credit', 'benefits', 'affordability', 'budget', 'debt_repayment', 'household_assessment');--> statement-breakpoint
CREATE TYPE "debt_payment_method" AS ENUM('direct_debit', 'standing_order', 'bank_transfer', 'debit_card', 'cash', 'salary_deduction', 'benefit_deduction', 'other');--> statement-breakpoint
CREATE TYPE "debt_payment_status" AS ENUM('pending', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "debt_payment_type" AS ENUM('scheduled', 'minimum', 'extra', 'settlement', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "debt_interest_type" AS ENUM('none', 'fixed', 'variable');--> statement-breakpoint
CREATE TYPE "debt_payment_frequency" AS ENUM('weekly', 'fortnightly', 'four_weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly');--> statement-breakpoint
CREATE TYPE "debt_priority" AS ENUM('priority', 'non_priority');--> statement-breakpoint
CREATE TYPE "debt_repayment_strategy" AS ENUM('minimum_only', 'snowball', 'avalanche', 'custom');--> statement-breakpoint
CREATE TYPE "debt_status" AS ENUM('active', 'paused', 'settled', 'defaulted', 'written_off');--> statement-breakpoint
CREATE TYPE "debt_type" AS ENUM('credit_card', 'overdraft', 'personal_loan', 'car_finance', 'mortgage', 'student_loan', 'council_tax', 'utility_arrears', 'rent_arrears', 'court_fine', 'ccj', 'hire_purchase', 'buy_now_pay_later', 'family_loan', 'other');--> statement-breakpoint
CREATE TYPE "expense_category" AS ENUM('housing', 'council_tax', 'utilities', 'food', 'transport', 'insurance', 'childcare', 'healthcare', 'education', 'communications', 'subscriptions', 'clothing', 'personal_care', 'entertainment', 'pets', 'maintenance', 'family_support', 'savings', 'debt_payment', 'tax', 'other');--> statement-breakpoint
CREATE TYPE "expense_frequency" AS ENUM('weekly', 'fortnightly', 'four_weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly', 'one_off');--> statement-breakpoint
CREATE TYPE "expense_payment_method" AS ENUM('direct_debit', 'standing_order', 'bank_transfer', 'debit_card', 'credit_card', 'cash', 'salary_deduction', 'benefit_deduction', 'other');--> statement-breakpoint
CREATE TYPE "expense_priority" AS ENUM('essential', 'important', 'discretionary');--> statement-breakpoint
CREATE TYPE "income_source_type" AS ENUM('employment', 'self_employment', 'state_pension', 'private_pension', 'benefit', 'maintenance', 'rental', 'investment', 'other');--> statement-breakpoint
CREATE TYPE "payment_frequency" AS ENUM('weekly', 'fortnightly', 'four_weekly', 'monthly', 'quarterly', 'half_yearly', 'yearly', 'one_off');--> statement-breakpoint
CREATE TYPE "employment_status" AS ENUM('employed', 'self_employed', 'unemployed', 'student', 'retired', 'not_working', 'unknown');--> statement-breakpoint
CREATE TYPE "household_member_type" AS ENUM('adult', 'child', 'non_dependent');--> statement-breakpoint
CREATE TYPE "household_relationship" AS ENUM('self', 'partner', 'child', 'step_child', 'foster_child', 'other_dependent', 'non_dependent', 'other');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"member_id" uuid,
	"type" "asset_type" NOT NULL,
	"ownership_type" "asset_ownership_type" DEFAULT 'household'::"asset_ownership_type" NOT NULL,
	"name" text NOT NULL,
	"current_value" numeric(14,2) DEFAULT '0.00' NOT NULL,
	"purchase_value" numeric(14,2),
	"purchase_date" date,
	"valuation_date" date,
	"is_liquid" boolean DEFAULT false NOT NULL,
	"include_in_net_worth" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"member_id" uuid,
	"type" "calculation_type" NOT NULL,
	"status" "calculation_status" DEFAULT 'pending'::"calculation_status" NOT NULL,
	"rule_set_key" text,
	"tax_year" text,
	"period_start" date,
	"period_end" date,
	"input" jsonb NOT NULL,
	"result" jsonb,
	"error" jsonb,
	"name" text,
	"idempotency_key" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debt_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"debt_id" uuid NOT NULL,
	"member_id" uuid,
	"type" "debt_payment_type" DEFAULT 'scheduled'::"debt_payment_type" NOT NULL,
	"status" "debt_payment_status" DEFAULT 'completed'::"debt_payment_status" NOT NULL,
	"method" "debt_payment_method",
	"amount" numeric(14,2) NOT NULL,
	"payment_date" date NOT NULL,
	"balance_before" numeric(14,2),
	"balance_after" numeric(14,2),
	"reference" text,
	"idempotency_key" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"member_id" uuid,
	"type" "debt_type" NOT NULL,
	"status" "debt_status" DEFAULT 'active'::"debt_status" NOT NULL,
	"priority" "debt_priority" DEFAULT 'non_priority'::"debt_priority" NOT NULL,
	"repayment_strategy" "debt_repayment_strategy" DEFAULT 'minimum_only'::"debt_repayment_strategy" NOT NULL,
	"name" text NOT NULL,
	"creditor_name" text,
	"current_balance" numeric(14,2) NOT NULL,
	"original_balance" numeric(14,2),
	"credit_limit" numeric(14,2),
	"minimum_payment" numeric(14,2),
	"payment_frequency" "debt_payment_frequency",
	"planned_payment" numeric(14,2),
	"interest_type" "debt_interest_type" DEFAULT 'none'::"debt_interest_type" NOT NULL,
	"annual_interest_rate" numeric(8,4),
	"payment_due_day" numeric(2,0),
	"start_date" date,
	"expected_end_date" date,
	"settled_at" date,
	"account_reference_encrypted" text,
	"account_reference_hash" text,
	"include_in_snowball" boolean DEFAULT true NOT NULL,
	"is_secured" boolean DEFAULT false NOT NULL,
	"is_joint" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"member_id" uuid,
	"category" "expense_category" NOT NULL,
	"priority" "expense_priority" DEFAULT 'important'::"expense_priority" NOT NULL,
	"name" text NOT NULL,
	"amount" numeric(14,2) NOT NULL,
	"frequency" "expense_frequency" NOT NULL,
	"payment_method" "expense_payment_method",
	"payment_due_day" numeric(2,0),
	"start_date" date,
	"end_date" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_fixed" boolean DEFAULT false NOT NULL,
	"is_household_expense" boolean DEFAULT true NOT NULL,
	"include_in_budget" boolean DEFAULT true NOT NULL,
	"payee" text,
	"account_reference_encrypted" text,
	"account_reference_hash" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "households" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"country" text DEFAULT 'GB' NOT NULL,
	"postcode_area" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"type" "income_source_type" NOT NULL,
	"name" text NOT NULL,
	"gross_amount" numeric(14,2) NOT NULL,
	"frequency" "payment_frequency" NOT NULL,
	"is_taxable" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" date,
	"end_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"household_id" uuid NOT NULL,
	"auth_user_id" text,
	"first_name" text NOT NULL,
	"last_name" text,
	"member_type" "household_member_type" NOT NULL,
	"relationship" "household_relationship" NOT NULL,
	"date_of_birth" date,
	"is_claimant" boolean DEFAULT false NOT NULL,
	"is_partner" boolean DEFAULT false NOT NULL,
	"is_dependent" boolean DEFAULT false NOT NULL,
	"employment_status" "employment_status" DEFAULT 'unknown'::"employment_status" NOT NULL,
	"is_student" boolean DEFAULT false NOT NULL,
	"has_disability" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "assets_household_id_idx" ON "assets" ("household_id");--> statement-breakpoint
CREATE INDEX "assets_member_id_idx" ON "assets" ("member_id");--> statement-breakpoint
CREATE INDEX "assets_type_idx" ON "assets" ("type");--> statement-breakpoint
CREATE INDEX "assets_active_idx" ON "assets" ("is_active");--> statement-breakpoint
CREATE INDEX "assets_household_active_idx" ON "assets" ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_uidx" ON "account" ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "invitation_organization_id_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "invitation_expires_at_idx" ON "invitation" ("expires_at");--> statement-breakpoint
CREATE INDEX "invitation_status_idx" ON "invitation" ("status");--> statement-breakpoint
CREATE INDEX "member_organization_id_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_user_id_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_organization_user_uidx" ON "member" ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_uidx" ON "session" ("token");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "session_expires_at_idx" ON "session" ("expires_at");--> statement-breakpoint
CREATE INDEX "session_active_organization_id_idx" ON "session" ("active_organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_uidx" ON "user" ("email");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "verification_expires_at_idx" ON "verification" ("expires_at");--> statement-breakpoint
CREATE INDEX "calculations_household_id_idx" ON "calculations" ("household_id");--> statement-breakpoint
CREATE INDEX "calculations_member_id_idx" ON "calculations" ("member_id");--> statement-breakpoint
CREATE INDEX "calculations_type_idx" ON "calculations" ("type");--> statement-breakpoint
CREATE INDEX "calculations_status_idx" ON "calculations" ("status");--> statement-breakpoint
CREATE INDEX "calculations_tax_year_idx" ON "calculations" ("tax_year");--> statement-breakpoint
CREATE INDEX "calculations_created_at_idx" ON "calculations" ("created_at");--> statement-breakpoint
CREATE INDEX "calculations_household_type_idx" ON "calculations" ("household_id","type");--> statement-breakpoint
CREATE INDEX "calculations_household_status_idx" ON "calculations" ("household_id","status");--> statement-breakpoint
CREATE INDEX "calculations_household_created_at_idx" ON "calculations" ("household_id","created_at");--> statement-breakpoint
CREATE INDEX "calculations_idempotency_key_idx" ON "calculations" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "debt_payments_household_id_idx" ON "debt_payments" ("household_id");--> statement-breakpoint
CREATE INDEX "debt_payments_debt_id_idx" ON "debt_payments" ("debt_id");--> statement-breakpoint
CREATE INDEX "debt_payments_member_id_idx" ON "debt_payments" ("member_id");--> statement-breakpoint
CREATE INDEX "debt_payments_payment_date_idx" ON "debt_payments" ("payment_date");--> statement-breakpoint
CREATE INDEX "debt_payments_status_idx" ON "debt_payments" ("status");--> statement-breakpoint
CREATE INDEX "debt_payments_household_debt_idx" ON "debt_payments" ("household_id","debt_id");--> statement-breakpoint
CREATE INDEX "debt_payments_debt_payment_date_idx" ON "debt_payments" ("debt_id","payment_date");--> statement-breakpoint
CREATE INDEX "debt_payments_household_payment_date_idx" ON "debt_payments" ("household_id","payment_date");--> statement-breakpoint
CREATE INDEX "debt_payments_idempotency_key_idx" ON "debt_payments" ("idempotency_key");--> statement-breakpoint
CREATE INDEX "debts_household_id_idx" ON "debts" ("household_id");--> statement-breakpoint
CREATE INDEX "debts_member_id_idx" ON "debts" ("member_id");--> statement-breakpoint
CREATE INDEX "debts_type_idx" ON "debts" ("type");--> statement-breakpoint
CREATE INDEX "debts_status_idx" ON "debts" ("status");--> statement-breakpoint
CREATE INDEX "debts_priority_idx" ON "debts" ("priority");--> statement-breakpoint
CREATE INDEX "debts_include_in_snowball_idx" ON "debts" ("include_in_snowball");--> statement-breakpoint
CREATE INDEX "debts_household_status_idx" ON "debts" ("household_id","status");--> statement-breakpoint
CREATE INDEX "debts_household_priority_idx" ON "debts" ("household_id","priority");--> statement-breakpoint
CREATE INDEX "debts_household_snowball_idx" ON "debts" ("household_id","include_in_snowball");--> statement-breakpoint
CREATE INDEX "debts_account_reference_hash_idx" ON "debts" ("account_reference_hash");--> statement-breakpoint
CREATE INDEX "expenses_household_id_idx" ON "expenses" ("household_id");--> statement-breakpoint
CREATE INDEX "expenses_member_id_idx" ON "expenses" ("member_id");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" ("category");--> statement-breakpoint
CREATE INDEX "expenses_priority_idx" ON "expenses" ("priority");--> statement-breakpoint
CREATE INDEX "expenses_active_idx" ON "expenses" ("is_active");--> statement-breakpoint
CREATE INDEX "expenses_frequency_idx" ON "expenses" ("frequency");--> statement-breakpoint
CREATE INDEX "expenses_household_active_idx" ON "expenses" ("household_id","is_active");--> statement-breakpoint
CREATE INDEX "expenses_household_category_idx" ON "expenses" ("household_id","category");--> statement-breakpoint
CREATE INDEX "expenses_household_priority_idx" ON "expenses" ("household_id","priority");--> statement-breakpoint
CREATE INDEX "expenses_household_budget_idx" ON "expenses" ("household_id","include_in_budget");--> statement-breakpoint
CREATE INDEX "expenses_account_reference_hash_idx" ON "expenses" ("account_reference_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "households_organization_id_unique" ON "households" ("organization_id");--> statement-breakpoint
CREATE INDEX "households_created_at_idx" ON "households" ("created_at");--> statement-breakpoint
CREATE INDEX "income_sources_household_id_idx" ON "income_sources" ("household_id");--> statement-breakpoint
CREATE INDEX "income_sources_member_id_idx" ON "income_sources" ("member_id");--> statement-breakpoint
CREATE INDEX "income_sources_type_idx" ON "income_sources" ("type");--> statement-breakpoint
CREATE INDEX "income_sources_active_idx" ON "income_sources" ("is_active");--> statement-breakpoint
CREATE INDEX "household_members_household_id_idx" ON "household_members" ("household_id");--> statement-breakpoint
CREATE INDEX "household_members_auth_user_id_idx" ON "household_members" ("auth_user_id");--> statement-breakpoint
CREATE INDEX "household_members_member_type_idx" ON "household_members" ("member_type");--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "calculations" ADD CONSTRAINT "calculations_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_debts_id_fkey" FOREIGN KEY ("debt_id") REFERENCES "debts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "households" ADD CONSTRAINT "households_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "income_sources" ADD CONSTRAINT "income_sources_member_id_household_members_id_fkey" FOREIGN KEY ("member_id") REFERENCES "household_members"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_household_id_households_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_auth_user_id_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "user"("id") ON DELETE SET NULL;