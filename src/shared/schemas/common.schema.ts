// src/shared/schemas/common.schema.ts
import { z } from "@hono/zod-openapi";

export const uuidSchema = z.uuid().openapi({
	example: "074f1038-70b1-467e-b5c6-72d14c8fa659",
	description: "A UUID identifier.",
});

export const idParamsSchema = z.object({
	id: uuidSchema,
});

export const householdIdParamsSchema = z.object({
	householdId: uuidSchema,
});

export const createdAtSchema = z.iso.datetime().openapi({
	example: "2026-07-30T18:00:00.000Z",
	description: "The date and time the resource was created.",
});

export const updatedAtSchema = z.iso.datetime().openapi({
	example: "2026-07-30T18:30:00.000Z",
	description: "The date and time the resource was last updated.",
});

export const dateSchema = z.iso.date().openapi({
	example: "2026-07-30",
	description: "A calendar date in YYYY-MM-DD format.",
});

export const optionalDateSchema = dateSchema.nullable();

export const currencyCodeSchema = z
	.string()
	.length(3)
	.transform((value) => value.toUpperCase())
	.pipe(z.literal("GBP"))
	.openapi({
		example: "GBP",
		description: "ISO 4217 currency code.",
	});

export const countryCodeSchema = z
	.string()
	.length(2)
	.transform((value) => value.toUpperCase())
	.pipe(z.literal("GB"))
	.openapi({
		example: "GB",
		description: "ISO 3166-1 alpha-2 country code.",
	});

export const ukPostcodeAreaSchema = z
	.string()
	.trim()
	.min(1)
	.max(4)
	.regex(/^[A-Za-z]{1,2}\d[A-Za-z\d]?$/, {
		message: "Enter a valid UK postcode area.",
	})
	.transform((value) => value.toUpperCase())
	.openapi({
		example: "SP4",
		description:
			"The outward postcode area or district, without the inward code.",
	});

export const nullableUkPostcodeAreaSchema =
	ukPostcodeAreaSchema.nullable();

export const nonEmptyStringSchema = z.string().trim().min(1);

export const resourceNameSchema = nonEmptyStringSchema
	.max(100)
	.openapi({
		example: "Jones Household",
		description: "A human-readable resource name.",
	});

export const sortDirectionSchema = z
	.enum(["asc", "desc"])
	.default("asc")
	.openapi({
		example: "asc",
		description: "The direction used to sort results.",
	});

export const requestIdSchema = z.string().min(1).openapi({
	example: "6bc9c4cc-c1be-4a7f-a2fd-f5a4991bb9ca",
	description:
		"A request identifier used for tracing and support.",
});

export const errorDetailSchema = z
	.object({
		field: z.string().optional(),
		message: z.string(),
	})
	.openapi("ErrorDetail");

export const errorSchema = z
	.object({
		code: z.string().openapi({
			example: "HOUSEHOLD_NOT_FOUND",
		}),

		message: z.string().openapi({
			example: "The household could not be found.",
		}),

		requestId: requestIdSchema,

		details: z.array(errorDetailSchema).optional(),
	})
	.openapi("Error");

export const errorResponseSchema = z
	.object({
		error: errorSchema,
	})
	.openapi("ErrorResponse");

export const successResponseSchema = z
	.object({
		success: z.literal(true),
	})
	.openapi("SuccessResponse");

export const deletedResourceResponseSchema = z
	.object({
		success: z.literal(true),
		deletedId: uuidSchema,
	})
	.openapi("DeletedResourceResponse");

export const timestampsSchema = z.object({
	createdAt: createdAtSchema,
	updatedAt: updatedAtSchema,
});

export type ErrorResponse = z.infer<
	typeof errorResponseSchema
>;

export type ErrorDetail = z.infer<
	typeof errorDetailSchema
>;

export type SortDirection = z.infer<
	typeof sortDirectionSchema
>;