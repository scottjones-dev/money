import { z } from "@hono/zod-openapi";

export { errorResponseSchema } from "@/shared/schemas/common.schema";

import {
	createPaginatedResponseSchema,
	paginationQuerySchema,
} from "@/shared/schemas/pagination.schema";

export const householdMemberTypeSchema = z.enum([
	"adult",
	"child",
	"non_dependent",
]);

export const householdRelationshipSchema = z.enum([
	"self",
	"partner",
	"child",
	"step_child",
	"foster_child",
	"other_dependent",
	"non_dependent",
	"other",
]);

export const employmentStatusSchema = z.enum([
	"employed",
	"self_employed",
	"unemployed",
	"student",
	"retired",
	"not_working",
	"unknown",
]);

const householdMemberInputBaseSchema = z.object({
	firstName: z.string().trim().min(1).max(100).openapi({
		example: "Scott",
	}),

	lastName: z.string().trim().min(1).max(100).optional().openapi({
		example: "Jones",
	}),

	authUserId: z.string().trim().min(1).optional().openapi({
		example: "user_123",
	}),

	memberType: householdMemberTypeSchema.openapi({
		example: "adult",
	}),

	relationship: householdRelationshipSchema.openapi({
		example: "self",
	}),

	dateOfBirth: z.iso.date().optional().openapi({
		example: "1995-05-10",
	}),

	isClaimant: z.boolean().default(false),

	isPartner: z.boolean().default(false),

	isDependent: z.boolean().default(false),

	employmentStatus: employmentStatusSchema.default("unknown"),

	isStudent: z.boolean().default(false),

	hasDisability: z.boolean().default(false),
});

function validateHouseholdMemberInput(
	value: {
		memberType?: z.infer<typeof householdMemberTypeSchema>;
		relationship?: z.infer<typeof householdRelationshipSchema>;
		isPartner?: boolean;
		isDependent?: boolean;
		employmentStatus?: z.infer<typeof employmentStatusSchema>;
	},
	context: z.RefinementCtx,
): void {
	if (value.relationship === "partner" && value.memberType !== "adult") {
		context.addIssue({
			code: "custom",
			path: ["memberType"],
			message: "A partner must be recorded as an adult.",
		});
	}

	if (
		(value.relationship === "child" ||
			value.relationship === "step_child" ||
			value.relationship === "foster_child") &&
		value.memberType !== "child"
	) {
		context.addIssue({
			code: "custom",
			path: ["memberType"],
			message: "A child relationship must use the child member type.",
		});
	}

	if (
		value.relationship === "non_dependent" &&
		value.memberType !== "non_dependent"
	) {
		context.addIssue({
			code: "custom",
			path: ["memberType"],
			message:
				"A non-dependant relationship must use the non-dependant member type.",
		});
	}

	if (value.memberType === "non_dependent" && value.isDependent === true) {
		context.addIssue({
			code: "custom",
			path: ["isDependent"],
			message:
				"A non-dependant household member cannot be marked as dependent.",
		});
	}

	if (value.memberType === "child" && value.isPartner === true) {
		context.addIssue({
			code: "custom",
			path: ["isPartner"],
			message: "A child cannot be marked as a partner.",
		});
	}

	if (value.memberType === "child" && value.employmentStatus === "retired") {
		context.addIssue({
			code: "custom",
			path: ["employmentStatus"],
			message: "A child cannot have retired employment status.",
		});
	}
}

export const createHouseholdMemberSchema = householdMemberInputBaseSchema
	.superRefine(validateHouseholdMemberInput)
	.openapi("CreateHouseholdMember");

export const updateHouseholdMemberSchema = householdMemberInputBaseSchema
	.partial()
	.superRefine(validateHouseholdMemberInput)
	.openapi("UpdateHouseholdMember");

export const householdMemberSchema = z
	.object({
		id: z.uuid(),

		householdId: z.uuid(),

		authUserId: z.string().nullable(),

		firstName: z.string(),

		lastName: z.string().nullable(),

		memberType: householdMemberTypeSchema,

		relationship: householdRelationshipSchema,

		dateOfBirth: z.iso.date().nullable(),

		isClaimant: z.boolean(),

		isPartner: z.boolean(),

		isDependent: z.boolean(),

		employmentStatus: employmentStatusSchema,

		isStudent: z.boolean(),

		hasDisability: z.boolean(),

		createdAt: z.iso.datetime(),

		updatedAt: z.iso.datetime(),
	})
	.openapi("HouseholdMember");

export const listMembersQuerySchema = paginationQuerySchema;

export const householdMemberListSchema = createPaginatedResponseSchema(
	householdMemberSchema,
	"HouseholdMemberList",
);

export const householdParamsSchema = z.object({
	householdId: z.uuid(),
});

export const householdMemberParamsSchema = z.object({
	householdId: z.uuid(),
	memberId: z.uuid(),
});

export const deleteHouseholdMemberResponseSchema = z
	.object({
		success: z.literal(true),
		deletedMemberId: z.uuid(),
	})
	.openapi("DeleteHouseholdMemberResponse");

export type CreateHouseholdMemberInput = z.infer<
	typeof createHouseholdMemberSchema
>;

export type UpdateHouseholdMemberInput = z.infer<
	typeof updateHouseholdMemberSchema
>;

export type HouseholdMemberResponse = z.infer<typeof householdMemberSchema>;

export type ListMembersQuery = z.infer<typeof listMembersQuerySchema>;
