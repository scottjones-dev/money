import { z } from "@hono/zod-openapi";

export { errorResponseSchema } from "@/shared/schemas/common.schema";

import {
	createPaginatedResponseSchema,
	paginationQuerySchema,
} from "@/shared/schemas/pagination.schema";

export const householdRoleSchema = z.string().min(1).openapi({
	example: "owner",
});

export const ukNationSchema = z
	.enum(["england", "scotland", "wales", "northern_ireland"])
	.openapi("UkNation", {
		description: "The UK nation whose devolved financial rules apply.",
		example: "england",
	});

export const householdSchema = z
	.object({
		id: z.uuid(),

		organizationId: z.string().min(1),

		name: z.string(),

		currency: z.literal("GBP"),

		country: z.literal("GB"),

		nation: ukNationSchema.nullable(),

		postcodeArea: z.string().nullable(),

		role: householdRoleSchema,

		createdAt: z.iso.datetime(),

		updatedAt: z.iso.datetime(),
	})
	.openapi("Household");

export const createHouseholdSchema = z
	.object({
		name: z.string().trim().min(1).max(100).openapi({
			example: "Jones Household",
		}),

		postcodeArea: z
			.string()
			.trim()
			.min(2)
			.max(10)
			.transform((value) => value.toUpperCase())
			.optional()
			.openapi({
				example: "SP4",
			}),

		nation: ukNationSchema.optional(),
	})
	.openapi("CreateHousehold");

export const updateHouseholdSchema = z
	.object({
		name: z.string().trim().min(1).max(100).optional(),
		postcodeArea: z
			.string()
			.trim()
			.min(2)
			.max(10)
			.transform((value) => value.toUpperCase())
			.nullable()
			.optional(),
		nation: ukNationSchema.nullable().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one household field must be supplied.",
	})
	.openapi("UpdateHousehold");

export const householdIdParamsSchema = z.object({
	householdId: z.uuid(),
});

export const listHouseholdsQuerySchema = paginationQuerySchema;

export const householdListSchema = createPaginatedResponseSchema(
	householdSchema,
	"HouseholdList",
);

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export type HouseholdResponse = z.infer<typeof householdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;

export type ListHouseholdsQuery = z.infer<typeof listHouseholdsQuerySchema>;
