import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";

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

const expensesRouter = createRouter();

expensesRouter.use("*", householdAccessMiddleware);

expensesRouter.openapi(createExpenseRoute, createExpenseHandler);

expensesRouter.openapi(listExpensesRoute, listExpensesHandler);

expensesRouter.openapi(getExpenseRoute, getExpenseHandler);

expensesRouter.openapi(updateExpenseRoute, updateExpenseHandler);

expensesRouter.openapi(deleteExpenseRoute, deleteExpenseHandler);

export default expensesRouter;
