import { z } from "@hono/zod-openapi";
import { benefitSchemeKeys } from "@/rules/benefits";
import { errorResponseSchema } from "@/shared/schemas/common.schema";
import {
	createPaginatedResponseSchema,
	paginationQuerySchema,
} from "@/shared/schemas/pagination.schema";

export { errorResponseSchema };

const money = z
	.string()
	.regex(/^\d{1,12}(?:\.\d{1,2})?$/)
	.openapi({
		description: "A non-negative pounds amount encoded as a decimal string.",
		example: "850.00",
	});
export const householdParams = z.object({ householdId: z.uuid() });
export const recordParams = z.object({
	householdId: z.uuid(),
	recordId: z.uuid(),
});
export const awardSchema = z
	.object({
		schemeKey: z.enum(benefitSchemeKeys),
		memberId: z.uuid().nullable().optional(),
		amount: money,
		frequency: z.enum([
			"weekly",
			"four_weekly",
			"monthly",
			"yearly",
			"one_off",
		]),
		status: z.enum(["declared", "awarded", "transitional"]),
		assessmentLevel: z.string().max(100).nullable().optional(),
	})
	.openapi("DeclaredBenefitAward");
export const householdFactsPayload = z
	.object({
		type: z.literal("household_facts"),
		housing: z
			.object({
				tenure: z.enum([
					"owner",
					"mortgage",
					"private_rent",
					"social_rent",
					"temporary",
					"other",
				]),
				monthlyRent: money.default("0.00"),
				eligibleMonthlyHousingCosts: money.default("0.00"),
				bedrooms: z.number().int().min(0).max(20).nullable().optional(),
				localHousingAllowance: money.nullable().optional(),
			})
			.nullable()
			.default(null),
		childcare: z
			.array(
				z.object({
					childMemberId: z.uuid(),
					monthlyCost: money,
					fundedHoursPerWeek: z.number().min(0).max(60).default(0),
					providerApproved: z.boolean().default(true),
					disabilitySupportRequired: z.boolean().default(false),
				}),
			)
			.default([]),
		circumstances: z
			.object({
				savingsAndCapital: money.default("0.00"),
				caringHoursPerWeek: z.number().min(0).max(168).default(0),
				responsibleForDisabledPerson: z.boolean().default(false),
				limitedCapabilityForWork: z
					.enum(["none", "lcw", "lcwra", "declared_pending"])
					.default("none"),
				pregnancyDueDate: z.iso.date().nullable().optional(),
				terminalIllness: z.boolean().default(false),
				refugeeStatus: z.boolean().default(false),
				ordinarilyResident: z.boolean().nullable().default(null),
				hasRecourseToPublicFunds: z.boolean().nullable().default(null),
				contributionConditionsMet: z.boolean().nullable().default(null),
				qualifyingBenefitReceived: z.boolean().nullable().default(null),
				statePensionQualifyingYears: z
					.number()
					.int()
					.min(0)
					.max(50)
					.nullable()
					.default(null),
			})
			.default({
				savingsAndCapital: "0.00",
				caringHoursPerWeek: 0,
				responsibleForDisabledPerson: false,
				limitedCapabilityForWork: "none",
				terminalIllness: false,
				refugeeStatus: false,
				ordinarilyResident: null,
				hasRecourseToPublicFunds: null,
				contributionConditionsMet: null,
				qualifyingBenefitReceived: null,
				statePensionQualifyingYears: null,
			}),
		existingAwards: z.array(awardSchema).default([]),
	})
	.openapi("HouseholdFactsPayload");
export const budgetPayload = z
	.object({
		type: z.literal("budget"),
		period: z.string().regex(/^\d{4}-\d{2}$/),
		monthlyIncome: money,
		monthlyExpenses: money,
		monthlyDebtPayments: money,
		categoryTargets: z.record(z.string(), money).default({}),
		notes: z.string().max(2000).nullable().optional(),
	})
	.openapi("BudgetPayload");
export const repaymentPlanPayload = z
	.object({
		type: z.literal("repayment_plan"),
		strategy: z.enum(["snowball", "avalanche", "minimum", "custom"]),
		monthlyBudget: money,
		projectedDebtFreeDate: z.iso.date().nullable(),
		totalInterest: money,
		schedule: z
			.array(
				z.object({
					month: z.string().regex(/^\d{4}-\d{2}$/),
					debtId: z.uuid(),
					openingBalance: money,
					payment: money,
					interest: money,
					closingBalance: money,
				}),
			)
			.max(1200),
		assumptions: z.array(z.string()).default([]),
	})
	.openapi("RepaymentPlanPayload");
export const assessmentPayload = z
	.object({
		type: z.literal("assessment"),
		calculatedAt: z.iso.datetime(),
		score: z.number().int().min(0).max(100),
		indicators: z.array(
			z.object({
				key: z.string(),
				status: z.enum(["good", "attention", "critical", "unknown"]),
				value: z.string(),
				explanation: z.string(),
			}),
		),
		completeness: z.number().min(0).max(100),
		warnings: z.array(z.string()),
		linkedCalculationIds: z.array(z.uuid()).default([]),
	})
	.openapi("AssessmentPayload");
export const recordPayload = z
	.discriminatedUnion("type", [
		householdFactsPayload,
		budgetPayload,
		repaymentPlanPayload,
		assessmentPayload,
	])
	.openapi("FinancialRecordPayload");
export const createRecordSchema = z
	.object({ name: z.string().trim().min(1).max(200), payload: recordPayload })
	.openapi("CreateFinancialRecord");
export const updateRecordSchema = z
	.object({
		name: z.string().trim().min(1).max(200).optional(),
		payload: recordPayload,
	})
	.openapi("UpdateFinancialRecord");
export const financialRecordSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		kind: z.enum(["household_facts", "budget", "repayment_plan", "assessment"]),
		name: z.string(),
		version: z.number().int().positive(),
		payload: recordPayload,
		summary: z.record(z.string(), z.unknown()),
		isCurrent: z.boolean(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("FinancialRecord");
export const recordListQuery = z.object({
	...paginationQuerySchema.shape,
	includeHistory: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.default(false),
});
export const recordList = createPaginatedResponseSchema(
	financialRecordSchema,
	"FinancialRecordList",
);
export const deletedRecord = z
	.object({ success: z.literal(true), deletedId: z.uuid() })
	.openapi("DeletedFinancialRecord");
export type RecordPayload = z.infer<typeof recordPayload>;
export type CreateRecord = z.infer<typeof createRecordSchema>;
export type UpdateRecord = z.infer<typeof updateRecordSchema>;
export type ListRecords = z.infer<typeof recordListQuery>;
export type RecordResponse = z.infer<typeof financialRecordSchema>;
