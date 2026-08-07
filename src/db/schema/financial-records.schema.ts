import {
	boolean,
	date,
	index,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { households } from "./households.schema";
import { householdMembers } from "./members.schema";

export const employmentTypeEnum = pgEnum("employment_type", [
	"employment",
	"self_employment",
]);

export const employments = pgTable(
	"employments",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, { onDelete: "cascade" }),
		memberId: uuid("member_id")
			.notNull()
			.references(() => householdMembers.id, { onDelete: "cascade" }),
		type: employmentTypeEnum("type").notNull(),
		name: text("name").notNull(),
		grossAnnualIncome: numeric("gross_annual_income", {
			precision: 14,
			scale: 2,
		}).notNull(),
		taxCode: text("tax_code"),
		niCategory: text("ni_category").notNull().default("A"),
		studentLoanPlans: jsonb("student_loan_plans")
			.$type<string[]>()
			.notNull()
			.default([]),
		pensionContributionPercent: numeric("pension_contribution_percent", {
			precision: 7,
			scale: 4,
		}),
		isActive: boolean("is_active").notNull().default(true),
		startDate: date("start_date", { mode: "string" }),
		endDate: date("end_date", { mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("employments_household_id_idx").on(table.householdId),
		index("employments_member_id_idx").on(table.memberId),
	],
);

export const pensionTypeEnum = pgEnum("pension_type", [
	"workplace_defined_contribution",
	"workplace_defined_benefit",
	"personal",
	"sipp",
	"state",
	"other",
]);

export const pensions = pgTable(
	"pensions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, { onDelete: "cascade" }),
		memberId: uuid("member_id")
			.notNull()
			.references(() => householdMembers.id, { onDelete: "cascade" }),
		type: pensionTypeEnum("type").notNull(),
		name: text("name").notNull(),
		currentValue: numeric("current_value", { precision: 14, scale: 2 })
			.notNull()
			.default("0.00"),
		personalMonthlyContribution: numeric("personal_monthly_contribution", {
			precision: 14,
			scale: 2,
		})
			.notNull()
			.default("0.00"),
		employerMonthlyContribution: numeric("employer_monthly_contribution", {
			precision: 14,
			scale: 2,
		})
			.notNull()
			.default("0.00"),
		retirementAge: numeric("retirement_age", { precision: 3, scale: 0 }),
		isActive: boolean("is_active").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index("pensions_household_id_idx").on(table.householdId)],
);

export const financialRecordKindEnum = pgEnum("financial_record_kind", [
	"household_facts",
	"budget",
	"repayment_plan",
	"assessment",
]);

export const financialRecords = pgTable(
	"financial_records",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, { onDelete: "cascade" }),
		kind: financialRecordKindEnum("kind").notNull(),
		name: text("name").notNull(),
		version: numeric("version", { precision: 8, scale: 0 })
			.notNull()
			.default("1"),
		payloadEncrypted: text("payload_encrypted").notNull(),
		encryptionKeyId: text("encryption_key_id").notNull(),
		summary: jsonb("summary")
			.$type<Record<string, unknown>>()
			.notNull()
			.default({}),
		isCurrent: boolean("is_current").notNull().default(true),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("financial_records_household_kind_idx").on(
			table.householdId,
			table.kind,
		),
		uniqueIndex("financial_records_household_kind_name_version_unique").on(
			table.householdId,
			table.kind,
			table.name,
			table.version,
		),
	],
);

export type Employment = typeof employments.$inferSelect;
export type NewEmployment = typeof employments.$inferInsert;
export type Pension = typeof pensions.$inferSelect;
export type NewPension = typeof pensions.$inferInsert;
export type FinancialRecord = typeof financialRecords.$inferSelect;
export type NewFinancialRecord = typeof financialRecords.$inferInsert;
