// src/db/schema/incomes.schema.ts
import {
	boolean,
	date,
	index,
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

export const incomeSourceTypeEnum = pgEnum("income_source_type", [
	"employment",
	"self_employment",
	"state_pension",
	"private_pension",
	"benefit",
	"maintenance",
	"rental",
	"investment",
	"other",
]);

export const paymentFrequencyEnum = pgEnum("payment_frequency", [
	"weekly",
	"fortnightly",
	"four_weekly",
	"monthly",
	"quarterly",
	"half_yearly",
	"yearly",
	"one_off",
]);

export const incomeSources = pgTable(
	"income_sources",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, {
				onDelete: "cascade",
			}),

		memberId: uuid("member_id")
			.notNull()
			.references(() => householdMembers.id, {
				onDelete: "cascade",
			}),

		type: incomeSourceTypeEnum("type").notNull(),

		name: text("name").notNull(),

		grossAmount: numeric("gross_amount", {
			precision: 14,
			scale: 2,
		}).notNull(),

		frequency: paymentFrequencyEnum("frequency").notNull(),

		isTaxable: boolean("is_taxable").notNull().default(true),

		isActive: boolean("is_active").notNull().default(true),

		startDate: date("start_date", {
			mode: "string",
		}),

		endDate: date("end_date", {
			mode: "string",
		}),

		notes: text("notes"),

		sourceCalculationId: uuid("source_calculation_id"),
		sourceCalculationKey: text("source_calculation_key"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		index("income_sources_household_id_idx").on(table.householdId),

		index("income_sources_member_id_idx").on(table.memberId),

		index("income_sources_type_idx").on(table.type),

		index("income_sources_active_idx").on(table.isActive),
		uniqueIndex("income_sources_source_calculation_key_unique").on(
			table.sourceCalculationId,
			table.sourceCalculationKey,
		),
	],
);

export type IncomeSource = typeof incomeSources.$inferSelect;

export type NewIncomeSource = typeof incomeSources.$inferInsert;
