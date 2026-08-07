import { z } from "@hono/zod-openapi";

export { errorResponseSchema as debtErrorResponseSchema } from "@/shared/schemas/common.schema";

import {
	createPaginatedResponseSchema,
	paginationQuerySchema,
} from "@/shared/schemas/pagination.schema";

const moneyAmountSchema = z
	.string()
	.trim()
	.regex(/^\d{1,12}(?:\.\d{1,2})?$/, {
		message:
			"Amount must be zero or greater with no more than two decimal places.",
	})
	.openapi({
		example: "1250.00",
	});

const percentageSchema = z
	.string()
	.trim()
	.regex(/^\d{1,3}(?:\.\d{1,4})?$/, {
		message: "Percentage must have no more than four decimal places.",
	})
	.refine((value) => Number(value) <= 100, {
		message: "Percentage cannot exceed 100.",
	})
	.openapi({
		example: "24.9000",
	});

export const debtTypeSchema = z.enum([
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

export const debtStatusSchema = z.enum([
	"active",
	"paused",
	"settled",
	"defaulted",
	"written_off",
]);

export const debtPrioritySchema = z.enum(["priority", "non_priority"]);

export const debtRepaymentStrategySchema = z.enum([
	"minimum_only",
	"snowball",
	"avalanche",
	"custom",
]);

export const debtInterestTypeSchema = z.enum(["none", "fixed", "variable"]);

export const debtPaymentFrequencySchema = z.enum([
	"weekly",
	"fortnightly",
	"four_weekly",
	"monthly",
	"quarterly",
	"half_yearly",
	"yearly",
]);

const paymentDueDaySchema = z.coerce.number().int().min(1).max(31);

export const householdIdParamsSchema = z.object({
	householdId: z.uuid(),
});

export const debtIdParamsSchema = z.object({
	householdId: z.uuid(),
	debtId: z.uuid(),
});

export const createDebtSchema = z
	.object({
		memberId: z.uuid().nullable().optional(),
		type: debtTypeSchema,
		status: debtStatusSchema.default("active"),
		priority: debtPrioritySchema.default("non_priority"),
		repaymentStrategy: debtRepaymentStrategySchema.default("minimum_only"),
		name: z.string().trim().min(1).max(200),
		creditorName: z.string().trim().max(200).nullable().optional(),
		currentBalance: moneyAmountSchema,
		originalBalance: moneyAmountSchema.nullable().optional(),
		creditLimit: moneyAmountSchema.nullable().optional(),
		minimumPayment: moneyAmountSchema.nullable().optional(),
		paymentFrequency: debtPaymentFrequencySchema.nullable().optional(),
		plannedPayment: moneyAmountSchema.nullable().optional(),
		interestType: debtInterestTypeSchema.default("none"),
		annualInterestRate: percentageSchema.nullable().optional(),
		paymentDueDay: paymentDueDaySchema.nullable().optional(),
		startDate: z.iso.date().nullable().optional(),
		expectedEndDate: z.iso.date().nullable().optional(),
		settledAt: z.iso.date().nullable().optional(),
		includeInSnowball: z.boolean().default(true),
		isSecured: z.boolean().default(false),
		isJoint: z.boolean().default(false),
		notes: z.string().trim().max(2_000).nullable().optional(),
	})
	.openapi("CreateDebt");

export const updateDebtSchema = z
	.object({
		memberId: z.uuid().nullable().optional(),
		type: debtTypeSchema.optional(),
		status: debtStatusSchema.optional(),
		priority: debtPrioritySchema.optional(),
		repaymentStrategy: debtRepaymentStrategySchema.optional(),
		name: z.string().trim().min(1).max(200).optional(),
		creditorName: z.string().trim().max(200).nullable().optional(),
		currentBalance: moneyAmountSchema.optional(),
		originalBalance: moneyAmountSchema.nullable().optional(),
		creditLimit: moneyAmountSchema.nullable().optional(),
		minimumPayment: moneyAmountSchema.nullable().optional(),
		paymentFrequency: debtPaymentFrequencySchema.nullable().optional(),
		plannedPayment: moneyAmountSchema.nullable().optional(),
		interestType: debtInterestTypeSchema.optional(),
		annualInterestRate: percentageSchema.nullable().optional(),
		paymentDueDay: paymentDueDaySchema.nullable().optional(),
		startDate: z.iso.date().nullable().optional(),
		expectedEndDate: z.iso.date().nullable().optional(),
		settledAt: z.iso.date().nullable().optional(),
		includeInSnowball: z.boolean().optional(),
		isSecured: z.boolean().optional(),
		isJoint: z.boolean().optional(),
		notes: z.string().trim().max(2_000).nullable().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one debt field must be supplied.",
	})
	.openapi("UpdateDebt");

export const listDebtsQuerySchema = z.object({
	...paginationQuerySchema.shape,
	memberId: z.uuid().optional(),
	type: debtTypeSchema.optional(),
	status: debtStatusSchema.optional(),
	priority: debtPrioritySchema.optional(),
	includeInSnowball: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),
});

export const normalisedDebtPaymentSchema = z.object({
	weekly: z.string(),
	monthly: z.string(),
	yearly: z.string(),
});

export const debtResponseSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		memberId: z.uuid().nullable(),
		type: debtTypeSchema,
		status: debtStatusSchema,
		priority: debtPrioritySchema,
		repaymentStrategy: debtRepaymentStrategySchema,
		name: z.string(),
		creditorName: z.string().nullable(),
		currentBalance: z.string(),
		originalBalance: z.string().nullable(),
		creditLimit: z.string().nullable(),
		minimumPayment: z.string().nullable(),
		paymentFrequency: debtPaymentFrequencySchema.nullable(),
		plannedPayment: z.string().nullable(),
		interestType: debtInterestTypeSchema,
		annualInterestRate: z.string().nullable(),
		paymentDueDay: z.number().int().nullable(),
		startDate: z.string().nullable(),
		expectedEndDate: z.string().nullable(),
		settledAt: z.string().nullable(),
		includeInSnowball: z.boolean(),
		isSecured: z.boolean(),
		isJoint: z.boolean(),
		notes: z.string().nullable(),
		normalisedPayment: normalisedDebtPaymentSchema.nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Debt");

export const debtListResponseSchema = createPaginatedResponseSchema(
	debtResponseSchema,
	"DebtList",
);

export const deleteDebtResponseSchema = z
	.object({
		success: z.literal(true),
	})
	.openapi("DeleteDebtResponse");

export type CreateDebtInput = z.infer<typeof createDebtSchema>;

export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;

export type ListDebtsQuery = z.infer<typeof listDebtsQuerySchema>;

export type DebtResponse = z.infer<typeof debtResponseSchema>;
