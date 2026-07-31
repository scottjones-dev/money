import { OpenAPIHono } from "@hono/zod-openapi";

import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import type { AppBindings } from "@/types/app";

import {
	createDebtHandler,
	deleteDebtHandler,
	getDebtHandler,
	listDebtsHandler,
	updateDebtHandler,
} from "./debts.handlers";
import {
	createDebtRoute,
	deleteDebtRoute,
	getDebtRoute,
	listDebtsRoute,
	updateDebtRoute,
} from "./debts.routes";

const debtsRouter = new OpenAPIHono<AppBindings>();

debtsRouter.use("*", householdAccessMiddleware);

debtsRouter.openapi(createDebtRoute, createDebtHandler);

debtsRouter.openapi(listDebtsRoute, listDebtsHandler);

debtsRouter.openapi(getDebtRoute, getDebtHandler);

debtsRouter.openapi(updateDebtRoute, updateDebtHandler);

debtsRouter.openapi(deleteDebtRoute, deleteDebtHandler);

export default debtsRouter;
