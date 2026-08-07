// src/modules/affordability/affordability.handlers.ts
import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";

import type { calculateAffordabilityRoute } from "./affordability.routes";
import { affordabilityService } from "./affordability.service";

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
