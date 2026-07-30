// src/db/schema/debts.schema.ts
import {
	boolean,
	date,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { households } from "./households.schema";
import { householdMembers } from "./members.schema";

export const debtTypeEnum = pgEnum("debt_type", [
	"credit_card",
	"overdraft",
	"personal_loan",
	"car_finance",
	"mortgage",
	"student_loan",
	"council_tax",
	"utility_arrears",
	"rent_arrears",
	"court_fine",
	"ccj",
	"hire_purchase",
	"buy_now_pay_later",
	"family_loan",
	"other",
]);

export const debtStatusEnum = pgEnum("debt_status", [
	"active",
	"paused",
	"settled",
	"defaulted",
	"written_off",
]);

export const debtPriorityEnum = pgEnum("debt_priority", [
	"priority",
	"non_priority",
]);

export const debtRepaymentStrategyEnum = pgEnum("debt_repayment_strategy", [
	"minimum_only",
	"snowball",
	"avalanche",
	"custom",
]);

export const debtInterestTypeEnum = pgEnum("debt_interest_type", [
	"none",
	"fixed",
	"variable",
]);

export const debtPaymentFrequencyEnum = pgEnum("debt_payment_frequency", [
	"weekly",
	"fortnightly",
	"four_weekly",
	"monthly",
	"quarterly",
	"half_yearly",
	"yearly",
]);

export const debts = pgTable(
	"debts",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		/**
		 * Every debt belongs to one household.
		 *
		 * Repository queries must always include householdId.
		 */
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, {
				onDelete: "cascade",
			}),

		/**
		 * Optional individual primarily responsible for the debt.
		 *
		 * Joint household debts may leave this null.
		 */
		memberId: uuid("member_id").references(() => householdMembers.id, {
			onDelete: "set null",
		}),

		type: debtTypeEnum("type").notNull(),

		status: debtStatusEnum("status").notNull().default("active"),

		priority: debtPriorityEnum("priority").notNull().default("non_priority"),

		repaymentStrategy: debtRepaymentStrategyEnum("repayment_strategy")
			.notNull()
			.default("minimum_only"),

		name: text("name").notNull(),

		creditorName: text("creditor_name"),

		/**
		 * Current outstanding balance in pounds.
		 */
		currentBalance: numeric("current_balance", {
			precision: 14,
			scale: 2,
		}).notNull(),

		/**
		 * Original borrowed or outstanding amount, when known.
		 */
		originalBalance: numeric("original_balance", {
			precision: 14,
			scale: 2,
		}),

		/**
		 * Credit limit for revolving debt such as credit cards
		 * and overdrafts.
		 */
		creditLimit: numeric("credit_limit", {
			precision: 14,
			scale: 2,
		}),

		/**
		 * Minimum amount due at each payment interval.
		 */
		minimumPayment: numeric("minimum_payment", {
			precision: 14,
			scale: 2,
		}),

		paymentFrequency: debtPaymentFrequencyEnum("payment_frequency"),

		/**
		 * Optional regular amount the household intends to pay.
		 *
		 * This can be greater than the contractual minimum payment.
		 */
		plannedPayment: numeric("planned_payment", {
			precision: 14,
			scale: 2,
		}),

		interestType: debtInterestTypeEnum("interest_type")
			.notNull()
			.default("none"),

		/**
		 * Annual percentage rate.
		 *
		 * Example:
		 * "24.9000" represents 24.9%.
		 */
		annualInterestRate: numeric("annual_interest_rate", {
			precision: 8,
			scale: 4,
		}),

		/**
		 * Day of the month on which payment is normally due.
		 *
		 * Service validation should enforce a value from 1 to 31.
		 */
		paymentDueDay: numeric("payment_due_day", {
			precision: 2,
			scale: 0,
		}),

		startDate: date("start_date", {
			mode: "string",
		}),

		expectedEndDate: date("expected_end_date", {
			mode: "string",
		}),

		settledAt: date("settled_at", {
			mode: "string",
		}),

		/**
		 * Optional encrypted creditor account or agreement reference.
		 */
		accountReferenceEncrypted: text("account_reference_encrypted"),

		/**
		 * Deterministic lookup hash for an encrypted account reference.
		 */
		accountReferenceHash: text("account_reference_hash"),

		includeInSnowball: boolean("include_in_snowball").notNull().default(true),

		isSecured: boolean("is_secured").notNull().default(false),

		isJoint: boolean("is_joint").notNull().default(false),

		notes: text("notes"),

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
		index("debts_household_id_idx").on(table.householdId),

		index("debts_member_id_idx").on(table.memberId),

		index("debts_type_idx").on(table.type),

		index("debts_status_idx").on(table.status),

		index("debts_priority_idx").on(table.priority),

		index("debts_include_in_snowball_idx").on(table.includeInSnowball),

		index("debts_household_status_idx").on(table.householdId, table.status),

		index("debts_household_priority_idx").on(table.householdId, table.priority),

		index("debts_household_snowball_idx").on(
			table.householdId,
			table.includeInSnowball,
		),

		index("debts_account_reference_hash_idx").on(table.accountReferenceHash),
	],
);

export type Debt = typeof debts.$inferSelect;

export type NewDebt = typeof debts.$inferInsert;
