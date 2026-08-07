// src/db/schema/expenses.schema.ts
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

export const expenseCategoryEnum = pgEnum("expense_category", [
	"housing",
	"council_tax",
	"utilities",
	"food",
	"transport",
	"insurance",
	"childcare",
	"healthcare",
	"education",
	"communications",
	"subscriptions",
	"clothing",
	"personal_care",
	"entertainment",
	"pets",
	"maintenance",
	"family_support",
	"savings",
	"debt_payment",
	"tax",
	"other",
]);

export const expenseFrequencyEnum = pgEnum("expense_frequency", [
	"weekly",
	"fortnightly",
	"four_weekly",
	"monthly",
	"quarterly",
	"half_yearly",
	"yearly",
	"one_off",
]);

export const expensePaymentMethodEnum = pgEnum("expense_payment_method", [
	"direct_debit",
	"standing_order",
	"bank_transfer",
	"debit_card",
	"credit_card",
	"cash",
	"salary_deduction",
	"benefit_deduction",
	"other",
]);

export const expensePriorityEnum = pgEnum("expense_priority", [
	"essential",
	"important",
	"discretionary",
]);

export const expenses = pgTable(
	"expenses",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		/**
		 * Every expense belongs to exactly one household.
		 *
		 * Repository queries must always include householdId.
		 */
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, {
				onDelete: "cascade",
			}),

		/**
		 * Optional household member primarily responsible for the expense.
		 *
		 * Shared household expenses may leave this null.
		 */
		memberId: uuid("member_id").references(() => householdMembers.id, {
			onDelete: "set null",
		}),

		category: expenseCategoryEnum("category").notNull(),

		priority: expensePriorityEnum("priority").notNull().default("important"),

		name: text("name").notNull(),

		/**
		 * Expense amount for one occurrence of the selected frequency.
		 *
		 * Examples:
		 *
		 * £150 weekly:
		 * amount = "150.00"
		 * frequency = "weekly"
		 *
		 * £1,200 yearly:
		 * amount = "1200.00"
		 * frequency = "yearly"
		 */
		amount: numeric("amount", {
			precision: 14,
			scale: 2,
		}).notNull(),

		frequency: expenseFrequencyEnum("frequency").notNull(),

		paymentMethod: expensePaymentMethodEnum("payment_method"),

		/**
		 * Day of the month on which the expense is normally paid.
		 *
		 * Service validation must enforce a value from 1 to 31.
		 */
		paymentDueDay: numeric("payment_due_day", {
			precision: 2,
			scale: 0,
		}),

		startDate: date("start_date", {
			mode: "string",
		}),

		endDate: date("end_date", {
			mode: "string",
		}),

		/**
		 * Whether this expense should be included in current budget and
		 * affordability calculations.
		 */
		isActive: boolean("is_active").notNull().default(true),

		/**
		 * Indicates whether the amount is contractually fixed.
		 *
		 * Variable expenses can be represented using the household's
		 * current estimate.
		 */
		isFixed: boolean("is_fixed").notNull().default(false),

		/**
		 * Marks expenses shared across the household rather than assigned
		 * to one member.
		 */
		isHouseholdExpense: boolean("is_household_expense").notNull().default(true),

		/**
		 * Controls whether the expense is included when calculating the
		 * household's disposable income.
		 */
		includeInBudget: boolean("include_in_budget").notNull().default(true),

		/**
		 * Optional merchant, provider or payee.
		 */
		payee: text("payee"),

		/**
		 * Optional encrypted account or customer reference.
		 */
		accountReferenceEncrypted: text("account_reference_encrypted"),

		/**
		 * Deterministic lookup hash for the encrypted reference.
		 */
		accountReferenceHash: text("account_reference_hash"),

		notes: text("notes"),

		sourceCalculationId: uuid("source_calculation_id"),

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
		index("expenses_household_id_idx").on(table.householdId),

		index("expenses_member_id_idx").on(table.memberId),

		index("expenses_category_idx").on(table.category),

		index("expenses_priority_idx").on(table.priority),

		index("expenses_active_idx").on(table.isActive),

		index("expenses_frequency_idx").on(table.frequency),

		index("expenses_household_active_idx").on(
			table.householdId,
			table.isActive,
		),

		index("expenses_household_category_idx").on(
			table.householdId,
			table.category,
		),

		index("expenses_household_priority_idx").on(
			table.householdId,
			table.priority,
		),

		index("expenses_household_budget_idx").on(
			table.householdId,
			table.includeInBudget,
		),

		index("expenses_account_reference_hash_idx").on(table.accountReferenceHash),
		uniqueIndex("expenses_source_calculation_unique").on(
			table.sourceCalculationId,
		),
	],
);

export type Expense = typeof expenses.$inferSelect;

export type NewExpense = typeof expenses.$inferInsert;
