import { z } from "@hono/zod-openapi";
import {
	nationSchema,
	studentLoanPlanSchema,
	taxYearSchema,
} from "@/modules/calculators/calculators.schemas";
import { benefitSchemeKeys } from "@/rules/benefits";
import { errorResponseSchema } from "@/shared/schemas/common.schema";
import {
	createPaginatedResponseSchema,
	paginationQuerySchema,
} from "@/shared/schemas/pagination.schema";

export { errorResponseSchema };

const money = z
	.string()
	.regex(/^-?\d{1,12}(?:\.\d{1,2})?$/)
	.openapi({
		description:
			"A pounds amount encoded as a decimal string to preserve precision.",
		example: "1250.00",
	});
const nonNegativeMoney = z
	.string()
	.regex(/^\d{1,12}(?:\.\d{1,2})?$/)
	.openapi({
		description: "A non-negative pounds amount encoded as a decimal string.",
		example: "1250.00",
	});
export const calculatorSchema = z
	.enum([
		"income_tax",
		"national_insurance",
		"student_loan",
		"payroll",
		"childcare",
		"child_maintenance",
		"universal_credit",
		"benefits",
		"pension",
		"affordability",
		"budget",
		"debt_repayment",
		"assessment",
	])
	.openapi("HouseholdCalculator", {
		description: "The versioned household calculation engine to run.",
		example: "universal_credit",
	});
export const previewParams = z.object({
	householdId: z.uuid(),
	calculator: calculatorSchema,
});
export const calculationParams = z.object({
	householdId: z.uuid(),
	calculationId: z.uuid(),
});
const base = {
	taxYear: taxYearSchema,
	name: z.string().trim().max(200).optional(),
	memberId: z.uuid().nullable().optional(),
};
const taxInput = z.object({
	calculator: z.literal("income_tax"),
	...base,
	grossAnnualIncome: nonNegativeMoney,
	pensionGrossContributions: nonNegativeMoney.default("0.00"),
});
const niInput = z.object({
	calculator: z.literal("national_insurance"),
	...base,
	employmentType: z.enum(["employee", "self_employed"]),
	annualEarnings: nonNegativeMoney,
});
const loanInput = z.object({
	calculator: z.literal("student_loan"),
	...base,
	annualEarnings: nonNegativeMoney,
	plans: z.array(studentLoanPlanSchema).min(1).max(3),
});
const payrollInput = z.object({
	calculator: z.literal("payroll"),
	...base,
	grossAnnualIncome: nonNegativeMoney,
	employmentType: z.enum(["employee", "self_employed"]),
	studentLoanPlans: z.array(studentLoanPlanSchema).max(3).default([]),
	pensionGrossContributions: nonNegativeMoney.default("0.00"),
});
const cmsInput = z.object({
	calculator: z.literal("child_maintenance"),
	...base,
	grossWeeklyIncome: nonNegativeMoney,
	qualifyingChildren: z.number().int().min(1).max(20),
	relevantOtherChildren: z.number().int().min(0).max(20).default(0),
	sharedCareNights: z.number().int().min(0).max(365).default(0),
	receivesQualifyingBenefits: z.boolean().default(false),
	collectionMethod: z
		.enum(["direct_pay", "collect_and_pay"])
		.default("direct_pay"),
	perspective: z.enum(["payer", "receiver"]).default("payer"),
});
const childcareInput = z.object({
	calculator: z.literal("childcare"),
	...base,
	nation: nationSchema.optional(),
	childAgeMonths: z.number().int().min(0).max(240),
	childDisabled: z.boolean().default(false),
	approvedProvider: z.boolean().default(true),
	bothParentsWorking: z.boolean().default(false),
	minimumEarningsMet: z.boolean().default(false),
	highestParentAdjustedNetIncome: nonNegativeMoney,
	monthlyChildcareCost: nonNegativeMoney,
	receivingUniversalCredit: z.boolean().default(false),
	usingTaxFreeChildcare: z.boolean().default(false),
});
const ucInput = z.object({
	calculator: z.literal("universal_credit"),
	...base,
	couple: z.boolean().default(false),
	claimantAge25OrOver: z.boolean().default(true),
	children: z
		.array(
			z.object({
				bornBeforeApril2017: z.boolean().default(false),
				disability: z.enum(["none", "lower", "higher"]).default("none"),
			}),
		)
		.max(20)
		.default([]),
	monthlyHousingCosts: nonNegativeMoney.default("0.00"),
	monthlyChildcareCosts: nonNegativeMoney.default("0.00"),
	monthlyNetEarnings: nonNegativeMoney.default("0.00"),
	capital: nonNegativeMoney.default("0.00"),
	workAllowanceEligible: z.boolean().default(false),
	lcwra: z.boolean().default(false),
	pre2026LcwraProtection: z.boolean().default(false),
	carer: z.boolean().default(false),
	monthlyDeductions: nonNegativeMoney.default("0.00"),
});
const benefitsInput = z.object({
	calculator: z.literal("benefits"),
	...base,
	useStoredFacts: z.boolean().default(true),
	nation: nationSchema.optional(),
	age: z.number().int().min(16).max(120),
	partner: z.boolean().default(false),
	dependentChildren: z.number().int().min(0).max(20).default(0),
	weeklyEarnings: nonNegativeMoney.default("0.00"),
	capital: nonNegativeMoney.default("0.00"),
	disabled: z.boolean().default(false),
	caring35Hours: z.boolean().default(false),
	statePensionAge: z.boolean().default(false),
	pregnantOrNewParent: z.boolean().default(false),
	bereaved: z.boolean().default(false),
	declaredSchemeKeys: z
		.array(z.enum(benefitSchemeKeys).openapi("BenefitSchemeKey"))
		.default([]),
	facts: z
		.object({
			ordinarilyResident: z.boolean().nullable().default(null),
			hasRecourseToPublicFunds: z.boolean().nullable().default(null),
			contributionConditionsMet: z.boolean().nullable().default(null),
			qualifyingBenefitReceived: z.boolean().nullable().default(null),
			guardianChildren: z.number().int().min(0).max(20).default(0),
			children: z
				.array(
					z.object({
						age: z.number().int().min(0).max(19),
						disabilityCareOutcome: z
							.enum(["none", "lowest", "middle", "highest", "pending"])
							.default("none"),
						disabilityMobilityOutcome: z
							.enum(["none", "lower", "higher", "pending"])
							.default("none"),
					}),
				)
				.max(20)
				.default([]),
			disabilityOutcome: z
				.object({
					dailyLiving: z
						.enum(["none", "standard", "enhanced", "pending"])
						.default("pending"),
					mobility: z
						.enum(["none", "standard", "enhanced", "pending"])
						.default("pending"),
				})
				.optional(),
			attendanceOutcome: z
				.enum(["none", "lower", "higher", "pending"])
				.default("pending"),
			statePensionQualifyingYears: z
				.number()
				.int()
				.min(0)
				.max(50)
				.nullable()
				.default(null),
			existingAwards: z
				.array(
					z.object({
						schemeKey: z.enum(benefitSchemeKeys),
						amount: nonNegativeMoney,
						frequency: z.enum([
							"weekly",
							"four_weekly",
							"monthly",
							"yearly",
							"one_off",
						]),
					}),
				)
				.default([]),
		})
		.optional(),
});
const pensionInput = z.object({
	calculator: z.literal("pension"),
	...base,
	currentAge: z.number().int().min(16).max(100),
	retirementAge: z.number().int().min(50).max(100),
	currentPot: nonNegativeMoney,
	monthlyPersonalContribution: nonNegativeMoney.default("0.00"),
	monthlyEmployerContribution: nonNegativeMoney.default("0.00"),
	annualGrowthRate: z
		.string()
		.regex(/^\d{1,2}(?:\.\d{1,4})?$/)
		.default("5.0000"),
	annualChargeRate: z
		.string()
		.regex(/^\d{1,2}(?:\.\d{1,4})?$/)
		.default("0.7500"),
	withdrawalRate: z
		.string()
		.regex(/^\d{1,2}(?:\.\d{1,4})?$/)
		.default("4.0000"),
});
const affordabilityInput = z.object({
	calculator: z.literal("affordability"),
	...base,
	monthlyNetIncome: nonNegativeMoney,
	monthlyExpenses: nonNegativeMoney,
	monthlyDebtPayments: nonNegativeMoney,
	proposedMonthlyCommitment: nonNegativeMoney.default("0.00"),
	requiredMonthlyBuffer: nonNegativeMoney.default("0.00"),
});
const budgetInput = z.object({
	calculator: z.literal("budget"),
	...base,
	period: z.string().regex(/^\d{4}-\d{2}$/),
	monthlyIncome: nonNegativeMoney,
	monthlyExpenses: nonNegativeMoney,
	monthlyDebtPayments: nonNegativeMoney,
	categoryTargets: z.record(z.string(), nonNegativeMoney).default({}),
});
const debtInput = z.object({
	calculator: z.literal("debt_repayment"),
	...base,
	strategy: z.enum(["snowball", "avalanche", "minimum", "custom"]),
	monthlyBudget: nonNegativeMoney,
	startDate: z.iso.date(),
	debts: z
		.array(
			z.object({
				debtId: z.uuid(),
				balance: nonNegativeMoney,
				annualInterestRate: z.string().regex(/^\d{1,3}(?:\.\d{1,4})?$/),
				minimumPayment: nonNegativeMoney,
				customPayment: nonNegativeMoney.optional(),
			}),
		)
		.min(1)
		.max(100),
});
const assessmentInput = z.object({
	calculator: z.literal("assessment"),
	...base,
	monthlyNetIncome: nonNegativeMoney,
	monthlyExpenses: nonNegativeMoney,
	liquidAssets: nonNegativeMoney,
	totalDebt: nonNegativeMoney,
	requiredFactsComplete: z.boolean().default(false),
});
export const calculationInputSchema = z
	.discriminatedUnion("calculator", [
		taxInput,
		niInput,
		loanInput,
		payrollInput,
		childcareInput,
		cmsInput,
		ucInput,
		benefitsInput,
		pensionInput,
		affordabilityInput,
		budgetInput,
		debtInput,
		assessmentInput,
	])
	.openapi("HouseholdCalculationInput");
const warning = z
	.object({
		code: z.string(),
		message: z.string(),
		severity: z.enum(["info", "warning"]),
	})
	.openapi("HouseholdCalculationWarning");
const output = z
	.object({
		type: calculatorSchema,
		annualAmount: money.nullable(),
		monthlyAmount: money.nullable(),
		weeklyAmount: money.nullable(),
		values: z.record(
			z.string(),
			z.union([z.string(), z.number(), z.boolean(), z.null()]),
		),
		items: z
			.array(
				z.object({
					key: z.string(),
					benefitSchemeKey: z.enum(benefitSchemeKeys).optional(),
					status: z.string(),
					amount: money.nullable(),
					explanation: z.string(),
					confirmed: z.boolean().optional(),
					weeklyAmount: money.nullable().optional(),
					monthlyAmount: money.nullable().optional(),
					annualAmount: money.nullable().optional(),
					missingFacts: z.array(z.string()).optional(),
					conflictGroup: z.string().nullable().optional(),
					ruleSetKey: z.string().nullable().optional(),
					sources: z.array(z.url()).optional(),
					scenarios: z
						.array(
							z.object({
								outcome: z.string(),
								weeklyAmount: money,
								explanation: z.string(),
							}),
						)
						.optional(),
				}),
			)
			.default([]),
		benefitAssessment: z
			.object({
				confirmedWeeklyAmount: money,
				confirmedMonthlyAmount: money,
				confirmedAnnualAmount: money,
				conditionalMinimumWeeklyAmount: money,
				conditionalMaximumWeeklyAmount: money,
				completeness: z.number().int().min(0).max(100),
				conflicts: z.array(z.string()),
			})
			.optional(),
		schedule: z
			.array(
				z.object({
					month: z.string(),
					debtId: z.uuid(),
					openingBalance: nonNegativeMoney,
					payment: nonNegativeMoney,
					interest: nonNegativeMoney,
					closingBalance: nonNegativeMoney,
				}),
			)
			.default([]),
		assumptions: z.array(z.string()).default([]),
		sources: z.array(z.url()),
	})
	.openapi("HouseholdCalculationOutput");
export const calculationSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		memberId: z.uuid().nullable(),
		calculator: calculatorSchema,
		status: z.enum(["pending", "completed", "failed"]),
		ruleSetKey: z.string().nullable(),
		taxYear: taxYearSchema.nullable(),
		name: z.string().nullable(),
		input: calculationInputSchema,
		output: output.nullable(),
		warnings: z.array(warning),
		committedLinks: z.array(
			z.object({ resourceType: z.string(), resourceId: z.uuid() }),
		),
		committedAt: z.iso.datetime().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("HouseholdCalculation");
export const calculationListQuery = z.object({
	...paginationQuerySchema.shape,
	calculator: calculatorSchema.optional(),
	status: z.enum(["pending", "completed", "failed"]).optional(),
});
export const calculationList = createPaginatedResponseSchema(
	calculationSchema,
	"HouseholdCalculationList",
);
export const deletedCalculation = z
	.object({ success: z.literal(true), deletedId: z.uuid() })
	.openapi("DeletedCalculation");
export type CalculationInput = z.infer<typeof calculationInputSchema>;
export type CalculationOutput = z.infer<typeof output>;
export type CalculationResponse = z.infer<typeof calculationSchema>;
export type ListCalculations = z.infer<typeof calculationListQuery>;
