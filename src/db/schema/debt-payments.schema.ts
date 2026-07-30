// src/db/schema/debt-payments.schema.ts
import {
	date,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { debts } from "./debts.schema";
import { households } from "./households.schema";
import { householdMembers } from "./members.schema";

export const debtPaymentTypeEnum = pgEnum("debt_payment_type", [
	"scheduled",
	"minimum",
	"extra",
	"settlement",
	"refund",
	"adjustment",
]);

export const debtPaymentStatusEnum = pgEnum("debt_payment_status", [
	"pending",
	"completed",
	"failed",
	"cancelled",
]);

export const debtPaymentMethodEnum = pgEnum("debt_payment_method", [
	"direct_debit",
	"standing_order",
	"bank_transfer",
	"debit_card",
	"cash",
	"salary_deduction",
	"benefit_deduction",
	"other",
]);

export const debtPayments = pgTable(
	"debt_payments",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		/**
		 * Stored directly for tenant isolation.
		 *
		 * Although the debt also belongs to a household, keeping the
		 * household ID here allows every repository query to be scoped
		 * without relying on a join.
		 */
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, {
				onDelete: "cascade",
			}),

		debtId: uuid("debt_id")
			.notNull()
			.references(() => debts.id, {
				onDelete: "cascade",
			}),

		/**
		 * Optional household member who made or is responsible for the
		 * payment.
		 */
		memberId: uuid("member_id").references(() => householdMembers.id, {
			onDelete: "set null",
		}),

		type: debtPaymentTypeEnum("type").notNull().default("scheduled"),

		status: debtPaymentStatusEnum("status").notNull().default("completed"),

		method: debtPaymentMethodEnum("method"),

		/**
		 * Positive payment amount in pounds.
		 *
		 * Refunds and corrections should use the appropriate payment type
		 * rather than relying on negative values.
		 */
		amount: numeric("amount", {
			precision: 14,
			scale: 2,
		}).notNull(),

		/**
		 * Date on which the payment was or will be made.
		 */
		paymentDate: date("payment_date", {
			mode: "string",
		}).notNull(),

		/**
		 * Balance immediately before the payment, when known.
		 */
		balanceBefore: numeric("balance_before", {
			precision: 14,
			scale: 2,
		}),

		/**
		 * Balance immediately after the payment, when known.
		 *
		 * This is a historical snapshot, not the source of truth for the
		 * debt's current balance.
		 */
		balanceAfter: numeric("balance_after", {
			precision: 14,
			scale: 2,
		}),

		/**
		 * Optional creditor or bank payment reference.
		 *
		 * Encrypt this value before persistence when it contains sensitive
		 * account information.
		 */
		reference: text("reference"),

		/**
		 * Optional idempotency key used to prevent duplicate payments when
		 * a client retries the same request.
		 */
		idempotencyKey: text("idempotency_key"),

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
		index("debt_payments_household_id_idx").on(table.householdId),

		index("debt_payments_debt_id_idx").on(table.debtId),

		index("debt_payments_member_id_idx").on(table.memberId),

		index("debt_payments_payment_date_idx").on(table.paymentDate),

		index("debt_payments_status_idx").on(table.status),

		index("debt_payments_household_debt_idx").on(
			table.householdId,
			table.debtId,
		),

		index("debt_payments_debt_payment_date_idx").on(
			table.debtId,
			table.paymentDate,
		),

		index("debt_payments_household_payment_date_idx").on(
			table.householdId,
			table.paymentDate,
		),

		index("debt_payments_idempotency_key_idx").on(table.idempotencyKey),
	],
);

export type DebtPayment = typeof debtPayments.$inferSelect;

export type NewDebtPayment = typeof debtPayments.$inferInsert;
