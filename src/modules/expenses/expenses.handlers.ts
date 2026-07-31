import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import type { AppRouteHandler, HouseholdContext } from "@/types/app";

import type {
	createExpenseRoute,
	deleteExpenseRoute,
	getExpenseRoute,
	listExpensesRoute,
	updateExpenseRoute,
} from "./expenses.routes";
import { expensesService } from "./expenses.service";

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
