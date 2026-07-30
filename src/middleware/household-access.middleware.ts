// src/middleware/household-access.middleware.ts
import { createMiddleware } from "hono/factory";

import { householdsRepository } from "@/modules/households/households.repository";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import { uuidSchema } from "@/shared/schemas/common.schema";
import type { AppBindings, HouseholdContext, HouseholdRole } from "@/types/app";

const HOUSEHOLD_ROLES = new Set<HouseholdRole>([
	"owner",
	"admin",
	"member",
	"viewer",
]);

function isHouseholdRole(value: string): value is HouseholdRole {
	return HOUSEHOLD_ROLES.has(value as HouseholdRole);
}

export const householdAccessMiddleware = createMiddleware<AppBindings>(
	async (context, next) => {
		const requestId = context.get("requestId");
		const user = context.get("user");

		if (!user) {
			return context.json(
				{
					error: {
						code: ERROR_CODES.AUTHENTICATION_REQUIRED,
						message: "Authentication is required.",
						requestId,
					},
				},
				401,
			);
		}

		const householdIdResult = uuidSchema.safeParse(
			context.req.param("householdId"),
		);

		if (!householdIdResult.success) {
			return context.json(
				{
					error: {
						code: ERROR_CODES.VALIDATION_ERROR,
						message: "A valid household ID is required.",
						requestId,
						details: [
							{
								field: "householdId",
								message: "The household ID must be a valid UUID.",
							},
						],
					},
				},
				422,
			);
		}

		const household = await householdsRepository.findMembership({
			userId: user.id,
			householdId: householdIdResult.data,
		});

		/*
		 * Return the same response for a missing household and one that the
		 * authenticated user cannot access. This avoids revealing whether
		 * another user's household exists.
		 */
		if (!household) {
			return context.json(
				{
					error: {
						code: ERROR_CODES.HOUSEHOLD_NOT_FOUND,
						message: "The household could not be found.",
						requestId,
					},
				},
				404,
			);
		}

		if (!isHouseholdRole(household.role)) {
			context.get("logger").error(
				{
					householdId: household.id,
					organizationId: household.organizationId,
					role: household.role,
				},
				"Unsupported household organization role",
			);

			return context.json(
				{
					error: {
						code: ERROR_CODES.INTERNAL_SERVER_ERROR,
						message: "An unexpected error occurred.",
						requestId,
					},
				},
				500,
			);
		}

		const householdContext: HouseholdContext = {
			id: household.id,
			organizationId: household.organizationId,
			name: household.name,
			role: household.role,
		};

		context.set("household", householdContext);

		await next();
	},
);
