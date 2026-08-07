// src/modules/income-sources/income-sources.index.ts
import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";

import {
	createIncomeSourceHandler,
	deleteIncomeSourceHandler,
	getIncomeSourceHandler,
	listIncomeSourcesHandler,
	updateIncomeSourceHandler,
} from "./income-sources.handlers";
import {
	createIncomeSourceRoute,
	deleteIncomeSourceRoute,
	getIncomeSourceRoute,
	listIncomeSourcesRoute,
	updateIncomeSourceRoute,
} from "./income-sources.routes";

const incomeSourcesRouter = createRouter();

incomeSourcesRouter.use("*", householdAccessMiddleware);

incomeSourcesRouter.openapi(createIncomeSourceRoute, createIncomeSourceHandler);

incomeSourcesRouter.openapi(listIncomeSourcesRoute, listIncomeSourcesHandler);

incomeSourcesRouter.openapi(getIncomeSourceRoute, getIncomeSourceHandler);

incomeSourcesRouter.openapi(updateIncomeSourceRoute, updateIncomeSourceHandler);

incomeSourcesRouter.openapi(deleteIncomeSourceRoute, deleteIncomeSourceHandler);

export default incomeSourcesRouter;
