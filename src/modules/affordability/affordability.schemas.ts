// src/modules/affordability/affordability.schemas.ts
import { z } from "@hono/zod-openapi";

const nonNegativeMoneySchema = z
	.string()
	.trim()
	.regex(/^\d{1,12}(?:\.\d{1,2})?$/, {
		message:
			"Amount must be zero or greater with no more than two decimal places.",
	})
	.openapi({
		example: "250.00",
	});

const percentageSchema = z
	.string()
	.trim()
	.regex(/^\d{1,3}(?:\.\d{1,2})?$/, {
		message: "Percentage must have no more than two decimal places.",
	})
	.refine((value) => Number(value) <= 100, {
		message: "Percentage cannot exceed 100.",
	})
	.openapi({
		example: "40.00",
	});

export const affordabilityRatingSchema = z.enum([
	"comfortable",
	"manageable",
	"stretched",
	"unaffordable",
]);

export const householdAffordabilityParamsSchema = z.object({
	householdId: z.uuid(),
});

export const calculateAffordabilityBodySchema = z
	.object({
		/**
		 * Proposed additional monthly payment.
		 *
		 * Examples:
		 * - new loan repayment
		 * - vehicle finance payment
		 * - increased rent
		 */
		proposedMonthlyCommitment: nonNegativeMoneySchema.default("0.00"),

		/**
		 * Amount the household wants left after all commitments.
		 */
		requiredMonthlyBuffer: nonNegativeMoneySchema.default("100.00"),

		/**
		 * Maximum acceptable debt-payment percentage.
		 */
		maximumDebtToIncomePercentage: percentageSchema.default("40.00"),
	})
	.openapi("CalculateAffordabilityRequest");

export const affordabilityTotalsSchema = z.object({
	netMonthlyIncome: z.string(),
	benefitIncome: z.string(),
	otherIncome: z.string(),
	totalMonthlyIncome: z.string(),

	essentialExpenses: z.string(),
	importantExpenses: z.string(),
	discretionaryExpenses: z.string(),
	debtPayments: z.string(),
	housingCosts: z.string(),
	totalMonthlyExpenses: z.string(),

	currentDisposableIncome: z.string(),
	projectedDisposableIncome: z.string(),
	requiredMonthlyBuffer: z.string(),
	availableAfterBuffer: z.string(),
	proposedMonthlyCommitment: z.string(),
});

export const affordabilityRatiosSchema = z.object({
	housingCostPercentage: z.string(),
	debtToIncomePercentage: z.string(),
	essentialCostPercentage: z.string(),
	totalExpensePercentage: z.string(),
	disposableIncomePercentage: z.string(),
});

export const affordabilityResponseSchema = z
	.object({
		householdId: z.uuid(),

		rating: affordabilityRatingSchema,

		isAffordable: z.boolean(),

		totals: affordabilityTotalsSchema,

		ratios: affordabilityRatiosSchema,

		reasons: z.array(z.string()),

		calculatedAt: z.string().datetime(),
	})
	.openapi("AffordabilityAssessment");

export const affordabilityErrorResponseSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		requestId: z.string(),
		details: z
			.array(
				z.object({
					field: z.string().optional(),
					message: z.string(),
				}),
			)
			.optional(),
	}),
});

export type CalculateAffordabilityInput = z.infer<
	typeof calculateAffordabilityBodySchema
>;

export type AffordabilityResponse = z.infer<typeof affordabilityResponseSchema>;
