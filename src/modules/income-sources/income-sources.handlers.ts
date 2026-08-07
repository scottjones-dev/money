// src/modules/income-sources/income-sources.handlers.ts
import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";

import type {
	createIncomeSourceRoute,
	deleteIncomeSourceRoute,
	getIncomeSourceRoute,
	listIncomeSourcesRoute,
	updateIncomeSourceRoute,
} from "./income-sources.routes";
import { incomeSourcesService } from "./income-sources.service";

export const createIncomeSourceHandler: AppRouteHandler<
	typeof createIncomeSourceRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const values = context.req.valid("json");

	const result = await incomeSourcesService.create({
		householdId: household.id,
		role: household.role,
		values,
	});

	return context.json(result, 201);
};

export const listIncomeSourcesHandler: AppRouteHandler<
	typeof listIncomeSourcesRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const query = context.req.valid("query");

	const result = await incomeSourcesService.list({
		householdId: household.id,
		query,
	});

	return context.json(result, 200);
};

export const getIncomeSourceHandler: AppRouteHandler<
	typeof getIncomeSourceRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { incomeSourceId } = context.req.valid("param");

	const result = await incomeSourcesService.get({
		householdId: household.id,
		incomeSourceId,
	});

	return context.json(result, 200);
};

export const updateIncomeSourceHandler: AppRouteHandler<
	typeof updateIncomeSourceRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { incomeSourceId } = context.req.valid("param");

	const values = context.req.valid("json");

	const result = await incomeSourcesService.update({
		householdId: household.id,
		incomeSourceId,
		role: household.role,
		values,
	});

	return context.json(result, 200);
};

export const deleteIncomeSourceHandler: AppRouteHandler<
	typeof deleteIncomeSourceRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { incomeSourceId } = context.req.valid("param");

	const result = await incomeSourcesService.delete({
		householdId: household.id,
		incomeSourceId,
		role: household.role,
	});

	return context.json(result, 200);
};
