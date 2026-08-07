// src/modules/income-sources/income-sources.schemas.ts
import { z } from "@hono/zod-openapi";

export { errorResponseSchema as incomeSourceErrorResponseSchema } from "@/shared/schemas/common.schema";

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
		example: "2450.75",
	});

export const incomeSourceTypeSchema = z.enum([
	"employment",
	"self_employment",
	"state_pension",
	"private_pension",
	"benefit",
	"maintenance",
	"rental",
	"investment",
	"other",
]);

export const paymentFrequencySchema = z.enum([
	"weekly",
	"fortnightly",
	"four_weekly",
	"monthly",
	"quarterly",
	"half_yearly",
	"yearly",
	"one_off",
]);

export const incomeSourceIdParamsSchema = z.object({
	householdId: z.uuid(),
	incomeSourceId: z.uuid(),
});

export const householdIdParamsSchema = z.object({
	householdId: z.uuid(),
});

export const createIncomeSourceSchema = z
	.object({
		memberId: z.uuid(),

		type: incomeSourceTypeSchema,

		name: z.string().trim().min(1).max(200),

		grossAmount: moneyAmountSchema,

		frequency: paymentFrequencySchema,

		isTaxable: z.boolean().default(true),

		isActive: z.boolean().default(true),

		startDate: z.iso.date().nullable().optional(),

		endDate: z.iso.date().nullable().optional(),

		notes: z.string().trim().max(2_000).nullable().optional(),
	})
	.openapi("CreateIncomeSource");

export const updateIncomeSourceSchema = z
	.object({
		memberId: z.uuid().optional(),

		type: incomeSourceTypeSchema.optional(),

		name: z.string().trim().min(1).max(200).optional(),

		grossAmount: moneyAmountSchema.optional(),

		frequency: paymentFrequencySchema.optional(),

		isTaxable: z.boolean().optional(),

		isActive: z.boolean().optional(),

		startDate: z.iso.date().nullable().optional(),

		endDate: z.iso.date().nullable().optional(),

		notes: z.string().trim().max(2_000).nullable().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one income-source field must be supplied.",
	})
	.openapi("UpdateIncomeSource");

export const listIncomeSourcesQuerySchema = z.object({
	...paginationQuerySchema.shape,
	memberId: z.uuid().optional(),

	type: incomeSourceTypeSchema.optional(),

	isActive: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),
});

export const normalisedIncomeSchema = z.object({
	weekly: z.string(),
	monthly: z.string(),
	yearly: z.string(),
});

export const incomeSourceResponseSchema = z
	.object({
		id: z.uuid(),

		householdId: z.uuid(),

		memberId: z.uuid(),

		type: incomeSourceTypeSchema,

		name: z.string(),

		grossAmount: z.string(),

		frequency: paymentFrequencySchema,

		isTaxable: z.boolean(),

		isActive: z.boolean(),

		startDate: z.string().nullable(),

		endDate: z.string().nullable(),

		notes: z.string().nullable(),

		normalised: normalisedIncomeSchema.nullable(),

		createdAt: z.string(),

		updatedAt: z.string(),
	})
	.openapi("IncomeSource");

export const incomeSourceListResponseSchema = createPaginatedResponseSchema(
	incomeSourceResponseSchema,
	"IncomeSourceList",
);

export const deleteIncomeSourceResponseSchema = z
	.object({
		success: z.literal(true),
	})
	.openapi("DeleteIncomeSourceResponse");

export type CreateIncomeSourceInput = z.infer<typeof createIncomeSourceSchema>;

export type UpdateIncomeSourceInput = z.infer<typeof updateIncomeSourceSchema>;

export type ListIncomeSourcesQuery = z.infer<
	typeof listIncomeSourcesQuerySchema
>;

export type IncomeSourceResponse = z.infer<typeof incomeSourceResponseSchema>;
