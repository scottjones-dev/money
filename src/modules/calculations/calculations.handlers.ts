import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";
import type {
	commitCalculationRoute,
	deleteCalculationRoute,
	getCalculationRoute,
	listCalculationsRoute,
	previewCalculationRoute,
} from "./calculations.routes";
import { calculationsService } from "./calculations.service";
export const previewCalculationHandler: AppRouteHandler<
	typeof previewCalculationRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await calculationsService.preview({
			householdId: h.id,
			calculator: c.req.valid("param").calculator,
			role: h.role,
			data: c.req.valid("json"),
		}),
		201,
	);
};
export const listCalculationsHandler: AppRouteHandler<
	typeof listCalculationsRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await calculationsService.list({
			householdId: h.id,
			query: c.req.valid("query"),
		}),
		200,
	);
};
export const getCalculationHandler: AppRouteHandler<
	typeof getCalculationRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await calculationsService.get(h.id, c.req.valid("param").calculationId),
		200,
	);
};
export const deleteCalculationHandler: AppRouteHandler<
	typeof deleteCalculationRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await calculationsService.delete(
			h.id,
			c.req.valid("param").calculationId,
			h.role,
		),
		200,
	);
};
export const commitCalculationHandler: AppRouteHandler<
	typeof commitCalculationRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	const user = c.get("user");
	if (!user)
		throw new Error(
			"Authenticated user missing after household access middleware.",
		);
	return c.json(
		await calculationsService.commit({
			householdId: h.id,
			calculationId: c.req.valid("param").calculationId,
			role: h.role,
			userId: user.id,
		}),
		200,
	);
};
