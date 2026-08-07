import { z } from "@hono/zod-openapi";
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
		example: "32000.00",
	});
const percent = z
	.string()
	.regex(/^\d{1,3}(?:\.\d{1,4})?$/)
	.openapi({
		description: "A percentage encoded as a decimal string.",
		example: "5.0000",
	});
export const householdParams = z.object({ householdId: z.uuid() });
export const employmentParams = z.object({
	householdId: z.uuid(),
	employmentId: z.uuid(),
});
export const pensionParams = z.object({
	householdId: z.uuid(),
	pensionId: z.uuid(),
});
export const employmentType = z.enum(["employment", "self_employment"]);
export const loanPlan = z.enum([
	"plan_1",
	"plan_2",
	"plan_4",
	"plan_5",
	"postgraduate",
]);
export const createEmploymentSchema = z
	.object({
		memberId: z.uuid(),
		type: employmentType,
		name: z.string().trim().min(1).max(200),
		grossAnnualIncome: money,
		taxCode: z.string().trim().max(20).nullable().optional(),
		niCategory: z.string().trim().length(1).default("A"),
		studentLoanPlans: z.array(loanPlan).max(3).default([]),
		pensionContributionPercent: percent.nullable().optional(),
		isActive: z.boolean().default(true),
		startDate: z.iso.date().nullable().optional(),
		endDate: z.iso.date().nullable().optional(),
	})
	.openapi("CreateEmployment");
export const updateEmploymentSchema = createEmploymentSchema
	.partial()
	.refine((v) => Object.keys(v).length > 0, {
		message: "At least one field is required.",
	})
	.openapi("UpdateEmployment");
export const employmentSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		memberId: z.uuid(),
		type: employmentType,
		name: z.string(),
		grossAnnualIncome: money,
		taxCode: z.string().nullable(),
		niCategory: z.string(),
		studentLoanPlans: z.array(loanPlan),
		pensionContributionPercent: percent.nullable(),
		isActive: z.boolean(),
		startDate: z.iso.date().nullable(),
		endDate: z.iso.date().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("Employment");
export const listEmploymentQuery = z.object({
	...paginationQuerySchema.shape,
	memberId: z.uuid().optional(),
	isActive: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
});
export const employmentList = createPaginatedResponseSchema(
	employmentSchema,
	"EmploymentList",
);
export const pensionType = z.enum([
	"workplace_defined_contribution",
	"workplace_defined_benefit",
	"personal",
	"sipp",
	"state",
	"other",
]);
export const createPensionSchema = z
	.object({
		memberId: z.uuid(),
		type: pensionType,
		name: z.string().trim().min(1).max(200),
		currentValue: money.default("0.00"),
		personalMonthlyContribution: money.default("0.00"),
		employerMonthlyContribution: money.default("0.00"),
		retirementAge: z.number().int().min(50).max(100).nullable().optional(),
		isActive: z.boolean().default(true),
	})
	.openapi("CreatePension");
export const updatePensionSchema = createPensionSchema
	.partial()
	.refine((v) => Object.keys(v).length > 0, {
		message: "At least one field is required.",
	})
	.openapi("UpdatePension");
export const pensionSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		memberId: z.uuid(),
		type: pensionType,
		name: z.string(),
		currentValue: money,
		personalMonthlyContribution: money,
		employerMonthlyContribution: money,
		retirementAge: z.number().int().nullable(),
		isActive: z.boolean(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("Pension");
export const listPensionsQuery = z.object({
	...paginationQuerySchema.shape,
	memberId: z.uuid().optional(),
	isActive: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
});
export const pensionList = createPaginatedResponseSchema(
	pensionSchema,
	"PensionList",
);
export const deletedProfileSchema = z
	.object({ success: z.literal(true), deletedId: z.uuid() })
	.openapi("DeletedFinancialProfile");
export type CreateEmployment = z.infer<typeof createEmploymentSchema>;
export type UpdateEmployment = z.infer<typeof updateEmploymentSchema>;
export type ListEmployment = z.infer<typeof listEmploymentQuery>;
export type EmploymentResponse = z.infer<typeof employmentSchema>;
export type CreatePension = z.infer<typeof createPensionSchema>;
export type UpdatePension = z.infer<typeof updatePensionSchema>;
export type ListPensions = z.infer<typeof listPensionsQuery>;
export type PensionResponse = z.infer<typeof pensionSchema>;
