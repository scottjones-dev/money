// src/db/schema/calculations.schema.ts
import {
	date,
	index,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { households } from "./households.schema";
import { householdMembers } from "./members.schema";

export const calculationTypeEnum = pgEnum("calculation_type", [
	"income_tax",
	"national_insurance",
	"student_loan",
	"universal_credit",
	"benefits",
	"affordability",
	"budget",
	"debt_repayment",
	"household_assessment",
]);

export const calculationStatusEnum = pgEnum("calculation_status", [
	"pending",
	"completed",
	"failed",
]);

export interface CalculationInputData {
	[key: string]: unknown;
}

export interface CalculationResultData {
	[key: string]: unknown;
}

export interface CalculationErrorData {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

export const calculations = pgTable(
	"calculations",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		/**
		 * Every calculation is scoped to a household.
		 *
		 * Repository queries must always include householdId to preserve
		 * tenant isolation.
		 */
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, {
				onDelete: "cascade",
			}),

		/**
		 * Optional household member associated with the calculation.
		 *
		 * Household-wide calculations such as affordability or budget
		 * summaries may leave this null.
		 */
		memberId: uuid("member_id").references(() => householdMembers.id, {
			onDelete: "set null",
		}),

		type: calculationTypeEnum("type").notNull(),

		status: calculationStatusEnum("status").notNull().default("pending"),

		/**
		 * Rule-set identifier used to reproduce the calculation.
		 *
		 * Examples:
		 * "2026-27"
		 * "universal-credit-2026-27-v1"
		 */
		ruleSetKey: text("rule_set_key"),

		/**
		 * UK tax-year label where relevant.
		 *
		 * Example: "2026-27"
		 */
		taxYear: text("tax_year"),

		/**
		 * Optional period covered by this calculation.
		 *
		 * These fields support assessment-period, monthly and annual
		 * calculations without forcing every calculation to use them.
		 */
		periodStart: date("period_start", {
			mode: "string",
		}),

		periodEnd: date("period_end", {
			mode: "string",
		}),

		/**
		 * Immutable snapshot of the input supplied to the calculation.
		 *
		 * Do not store secrets, passwords or raw bank credentials here.
		 */
		input: jsonb("input").$type<CalculationInputData>().notNull(),

		/**
		 * Completed calculation output.
		 *
		 * Null while pending or when the calculation failed.
		 */
		result: jsonb("result").$type<CalculationResultData>(),

		/**
		 * Structured failure information.
		 *
		 * Null for pending and completed calculations.
		 */
		error: jsonb("error").$type<CalculationErrorData>(),

		/**
		 * Human-readable label supplied by the application or user.
		 */
		name: text("name"),

		/**
		 * Optional idempotency key used to prevent duplicate calculations
		 * being created by repeated client requests.
		 */
		idempotencyKey: text("idempotency_key"),

		startedAt: timestamp("started_at", {
			withTimezone: true,
			mode: "date",
		}),

		completedAt: timestamp("completed_at", {
			withTimezone: true,
			mode: "date",
		}),

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
		index("calculations_household_id_idx").on(table.householdId),

		index("calculations_member_id_idx").on(table.memberId),

		index("calculations_type_idx").on(table.type),

		index("calculations_status_idx").on(table.status),

		index("calculations_tax_year_idx").on(table.taxYear),

		index("calculations_created_at_idx").on(table.createdAt),

		index("calculations_household_type_idx").on(table.householdId, table.type),

		index("calculations_household_status_idx").on(
			table.householdId,
			table.status,
		),

		index("calculations_household_created_at_idx").on(
			table.householdId,
			table.createdAt,
		),

		index("calculations_idempotency_key_idx").on(table.idempotencyKey),
	],
);

export type Calculation = typeof calculations.$inferSelect;

export type NewCalculation = typeof calculations.$inferInsert;
