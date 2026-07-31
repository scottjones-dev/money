// src/modules/affordability/affordability.handlers.ts
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import type { AppRouteHandler, HouseholdContext } from "@/types/app";

import type { calculateAffordabilityRoute } from "./affordability.routes";
import { affordabilityService } from "./affordability.service";

function getRequiredHousehold(
	household: HouseholdContext | null,
): HouseholdContext {
	if (!household) {
		throw new AppError({
			code: ERROR_CODES.HOUSEHOLD_NOT_FOUND,
			message: "The household could not be found.",
			statusCode: 404,
		});
	}

	return household;
}

export const calculateAffordabilityHandler: AppRouteHandler<
	typeof calculateAffordabilityRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const values = context.req.valid("json");

	const result = await affordabilityService.calculate({
		householdId: household.id,
		values,
	});

	return context.json(result, 200);
};
