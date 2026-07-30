import { z } from "@hono/zod-openapi";

export const householdRoleSchema = z
	.string()
	.min(1)
	.openapi({
		example: "owner",
	});

export const householdSchema = z
	.object({
		id: z.uuid(),

		organizationId: z.string().min(1),

		name: z.string(),

		currency: z.literal("GBP"),

		country: z.literal("GB"),

		postcodeArea: z.string().nullable(),

		role: householdRoleSchema,

		createdAt: z.iso.datetime(),

		updatedAt: z.iso.datetime(),
	})
	.openapi("Household");

export const createHouseholdSchema = z
	.object({
		name: z
			.string()
			.trim()
			.min(1)
			.max(100)
			.openapi({
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
	})
	.openapi("CreateHousehold");

export const householdIdParamsSchema = z.object({
	householdId: z.uuid(),
});

export const householdListSchema = z
	.array(householdSchema)
	.openapi("HouseholdList");

export const errorResponseSchema = z
	.object({
		error: z.object({
			code: z.string(),
			message: z.string(),
			requestId: z.string(),
		}),
	})
	.openapi("ErrorResponse");
    
export type CreateHouseholdInput = z.infer<
	typeof createHouseholdSchema
>;

export type HouseholdResponse = z.infer<
	typeof householdSchema
>;