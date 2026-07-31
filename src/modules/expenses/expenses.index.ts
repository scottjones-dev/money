import { OpenAPIHono } from "@hono/zod-openapi";

import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import type { AppBindings } from "@/types/app";

import {
	createExpenseHandler,
	deleteExpenseHandler,
	getExpenseHandler,
	listExpensesHandler,
	updateExpenseHandler,
} from "./expenses.handlers";
import {
	createExpenseRoute,
	deleteExpenseRoute,
	getExpenseRoute,
	listExpensesRoute,
	updateExpenseRoute,
} from "./expenses.routes";

const expensesRouter = new OpenAPIHono<AppBindings>();

expensesRouter.use("*", householdAccessMiddleware);

expensesRouter.openapi(createExpenseRoute, createExpenseHandler);

expensesRouter.openapi(listExpensesRoute, listExpensesHandler);

expensesRouter.openapi(getExpenseRoute, getExpenseHandler);

expensesRouter.openapi(updateExpenseRoute, updateExpenseHandler);

expensesRouter.openapi(deleteExpenseRoute, deleteExpenseHandler);

export default expensesRouter;
