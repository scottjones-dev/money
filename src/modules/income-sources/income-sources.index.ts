// src/modules/income-sources/income-sources.index.ts
import { OpenAPIHono } from "@hono/zod-openapi";

import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import type { AppBindings } from "@/types/app";

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

const incomeSourcesRouter = new OpenAPIHono<AppBindings>();

incomeSourcesRouter.use("*", householdAccessMiddleware);

incomeSourcesRouter.openapi(createIncomeSourceRoute, createIncomeSourceHandler);

incomeSourcesRouter.openapi(listIncomeSourcesRoute, listIncomeSourcesHandler);

incomeSourcesRouter.openapi(getIncomeSourceRoute, getIncomeSourceHandler);

incomeSourcesRouter.openapi(updateIncomeSourceRoute, updateIncomeSourceHandler);

incomeSourcesRouter.openapi(deleteIncomeSourceRoute, deleteIncomeSourceHandler);

export default incomeSourcesRouter;
