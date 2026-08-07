import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";

import type {
	createExpenseRoute,
	deleteExpenseRoute,
	getExpenseRoute,
	listExpensesRoute,
	updateExpenseRoute,
} from "./expenses.routes";
import { expensesService } from "./expenses.service";

export const createExpenseHandler: AppRouteHandler<
	typeof createExpenseRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const values = context.req.valid("json");

	const result = await expensesService.create({
		householdId: household.id,
		role: household.role,
		values,
	});

	return context.json(result, 201);
};

export const listExpensesHandler: AppRouteHandler<
	typeof listExpensesRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const query = context.req.valid("query");

	const result = await expensesService.list({
		householdId: household.id,
		query,
	});

	return context.json(result, 200);
};

export const getExpenseHandler: AppRouteHandler<
	typeof getExpenseRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { expenseId } = context.req.valid("param");

	const result = await expensesService.get({
		householdId: household.id,
		expenseId,
	});

	return context.json(result, 200);
};

export const updateExpenseHandler: AppRouteHandler<
	typeof updateExpenseRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { expenseId } = context.req.valid("param");

	const values = context.req.valid("json");

	const result = await expensesService.update({
		householdId: household.id,
		expenseId,
		role: household.role,
		values,
	});

	return context.json(result, 200);
};

export const deleteExpenseHandler: AppRouteHandler<
	typeof deleteExpenseRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));

	const { expenseId } = context.req.valid("param");

	const result = await expensesService.delete({
		householdId: household.id,
		expenseId,
		role: household.role,
	});

	return context.json(result, 200);
};
