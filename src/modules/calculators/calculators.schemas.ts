import { z } from "@hono/zod-openapi";

import { errorResponseSchema } from "@/shared/schemas/common.schema";

export { errorResponseSchema };

export const taxYearSchema = z
	.enum(["2022-23", "2023-24", "2024-25", "2025-26", "2026-27"])
	.openapi("SupportedTaxYear", {
		description: "A supported UK tax year running from 6 April to 5 April.",
		example: "2026-27",
	});
export const nationSchema = z
	.enum(["england", "scotland", "wales", "northern_ireland"])
	.openapi("CalculatorNation", {
		description: "The UK nation whose devolved rules apply.",
		example: "england",
	});
export const decimalMoneySchema = z
	.string()
	.regex(/^\d{1,12}(?:\.\d{1,2})?$/)
	.openapi({
		description:
			"A non-negative pounds amount encoded as a decimal string to preserve precision.",
		example: "42000.00",
	});
const percentageSchema = z
	.string()
	.regex(/^\d{1,3}(?:\.\d{1,4})?$/)
	.openapi({
		description: "A percentage encoded as a decimal string.",
		example: "5.0000",
	});

export const calculationStepSchema = z
	.object({
		label: z.string().openapi({
			description: "The rule or calculation step.",
			example: "basic band",
		}),
		amount: decimalMoneySchema,
		rate: percentageSchema.nullable(),
		result: decimalMoneySchema,
	})
	.openapi("CalculationStep");

export const calculatorWarningSchema = z
	.object({
		code: z.enum([
			"ANNUALISED_ESTIMATE",
			"OFFICIAL_ASSESSMENT_REQUIRED",
			"MISSING_FACT",
			"INELIGIBLE",
			"CONFLICTING_SUPPORT",
			"RULE_UNAVAILABLE",
			"COURT_CALCULATION_REQUIRED",
			"NOT_FINANCIAL_ADVICE",
		]),
		message: z.string().openapi({
			description: "A human-readable explanation.",
			example: "This is an annual estimate.",
		}),
		severity: z.enum(["info", "warning"]),
	})
	.openapi("CalculatorWarning");

const metadataSchema = z
	.object({
		ruleSetKey: z.string().openapi({
			description: "Stable identifier for the exact rules used.",
			example: "income-tax-2026-27-v1",
		}),
		taxYear: taxYearSchema,
		calculatedAt: z.iso.datetime(),
		sources: z
			.array(z.url())
			.openapi({ description: "Official sources supporting the rule set." }),
		warnings: z.array(calculatorWarningSchema),
	})
	.openapi("CalculatorMetadata");

export const incomeTaxRequestSchema = z
	.object({
		taxYear: taxYearSchema,
		nation: nationSchema,
		grossAnnualIncome: decimalMoneySchema,
		pensionGrossContributions: decimalMoneySchema.default("0.00"),
	})
	.openapi("IncomeTaxCalculatorRequest");

export const incomeTaxResponseSchema = z
	.object({
		type: z.literal("income_tax"),
		metadata: metadataSchema,
		grossAnnualIncome: decimalMoneySchema,
		adjustedNetIncome: decimalMoneySchema,
		personalAllowance: decimalMoneySchema,
		taxableIncome: decimalMoneySchema,
		annualTax: decimalMoneySchema,
		monthlyTax: decimalMoneySchema,
		steps: z.array(calculationStepSchema),
	})
	.openapi("IncomeTaxCalculatorResult");

export const nationalInsuranceRequestSchema = z
	.object({
		taxYear: taxYearSchema,
		employmentType: z.enum(["employee", "self_employed"]).default("employee"),
		annualEarnings: decimalMoneySchema,
	})
	.openapi("NationalInsuranceCalculatorRequest");

export const nationalInsuranceResponseSchema = z
	.object({
		type: z.literal("national_insurance"),
		metadata: metadataSchema,
		employmentType: z.enum(["employee", "self_employed"]),
		annualEarnings: decimalMoneySchema,
		annualContributions: decimalMoneySchema,
		monthlyContributions: decimalMoneySchema,
		steps: z.array(calculationStepSchema),
	})
	.openapi("NationalInsuranceCalculatorResult");

export const studentLoanPlanSchema = z
	.enum(["plan_1", "plan_2", "plan_4", "plan_5", "postgraduate"])
	.openapi("StudentLoanPlan", {
		description: "A UK student or postgraduate loan repayment plan.",
		example: "plan_2",
	});
export const studentLoanRequestSchema = z
	.object({
		taxYear: taxYearSchema,
		annualEarnings: decimalMoneySchema,
		plans: z.array(studentLoanPlanSchema).min(1).max(3),
	})
	.openapi("StudentLoanCalculatorRequest");
export const studentLoanResponseSchema = z
	.object({
		type: z.literal("student_loan"),
		metadata: metadataSchema,
		annualEarnings: decimalMoneySchema,
		annualRepayment: decimalMoneySchema,
		monthlyRepayment: decimalMoneySchema,
		steps: z.array(calculationStepSchema),
	})
	.openapi("StudentLoanCalculatorResult");

export const pensionReliefRequestSchema = z
	.object({
		taxYear: taxYearSchema,
		nation: nationSchema,
		grossAnnualIncome: decimalMoneySchema,
		contribution: decimalMoneySchema,
		contributionBasis: z
			.enum(["gross", "relief_at_source_net"])
			.default("gross"),
	})
	.openapi("PensionReliefCalculatorRequest");
export const pensionReliefResponseSchema = z
	.object({
		type: z.literal("pension_relief"),
		metadata: metadataSchema,
		grossContribution: decimalMoneySchema,
		personalCost: decimalMoneySchema,
		providerRelief: decimalMoneySchema,
		estimatedAdditionalRelief: decimalMoneySchema,
		steps: z.array(calculationStepSchema),
	})
	.openapi("PensionReliefCalculatorResult");

export const takeHomeRequestSchema = z
	.object({
		taxYear: taxYearSchema,
		nation: nationSchema,
		grossAnnualIncome: decimalMoneySchema,
		employmentType: z.enum(["employee", "self_employed"]).default("employee"),
		studentLoanPlans: z.array(studentLoanPlanSchema).max(3).default([]),
		pensionGrossContributions: decimalMoneySchema.default("0.00"),
	})
	.openapi("TakeHomePayCalculatorRequest");
export const takeHomeResponseSchema = z
	.object({
		type: z.literal("take_home_pay"),
		metadata: metadataSchema,
		grossAnnualIncome: decimalMoneySchema,
		incomeTax: decimalMoneySchema,
		nationalInsurance: decimalMoneySchema,
		studentLoan: decimalMoneySchema,
		pensionContributions: decimalMoneySchema,
		netAnnualIncome: decimalMoneySchema,
		netMonthlyIncome: decimalMoneySchema,
		netWeeklyIncome: decimalMoneySchema,
		steps: z.array(calculationStepSchema),
	})
	.openapi("TakeHomePayCalculatorResult");

export type IncomeTaxRequest = z.infer<typeof incomeTaxRequestSchema>;
export type NationalInsuranceRequest = z.infer<
	typeof nationalInsuranceRequestSchema
>;
export type StudentLoanRequest = z.infer<typeof studentLoanRequestSchema>;
export type PensionReliefRequest = z.infer<typeof pensionReliefRequestSchema>;
export type TakeHomeRequest = z.infer<typeof takeHomeRequestSchema>;
