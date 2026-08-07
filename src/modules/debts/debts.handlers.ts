import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";

import type {
	createDebtRoute,
	deleteDebtRoute,
	getDebtRoute,
	listDebtsRoute,
	updateDebtRoute,
} from "./debts.routes";
import { debtsService } from "./debts.service";

export const createDebtHandler: AppRouteHandler<
	typeof createDebtRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const values = context.req.valid("json");

	const result = await debtsService.create({
		householdId: household.id,
		role: household.role,
		values,
	});

	return context.json(result, 201);
};

export const listDebtsHandler: AppRouteHandler<typeof listDebtsRoute> = async (
	context,
) => {
	const household = getRequiredHousehold(context.get("household"));

	const query = context.req.valid("query");

	const result = await debtsService.list({
		householdId: household.id,
		query,
	});

	return context.json(result, 200);
};

export const getDebtHandler: AppRouteHandler<typeof getDebtRoute> = async (
	context,
) => {
	const household = getRequiredHousehold(context.get("household"));

	const { debtId } = context.req.valid("param");

	const result = await debtsService.get({
		householdId: household.id,
		debtId,
	});

	return context.json(result, 200);
};

export const updateDebtHandler: AppRouteHandler<
	typeof updateDebtRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { debtId } = context.req.valid("param");

	const values = context.req.valid("json");

	const result = await debtsService.update({
		householdId: household.id,
		debtId,
		role: household.role,
		values,
	});

	return context.json(result, 200);
};

export const deleteDebtHandler: AppRouteHandler<
	typeof deleteDebtRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { debtId } = context.req.valid("param");

	const result = await debtsService.delete({
		householdId: household.id,
		debtId,
		role: household.role,
	});

	return context.json(result, 200);
};
