import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";

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

const debtsRouter = createRouter();

debtsRouter.use("*", householdAccessMiddleware);

debtsRouter.openapi(createDebtRoute, createDebtHandler);

debtsRouter.openapi(listDebtsRoute, listDebtsHandler);

debtsRouter.openapi(getDebtRoute, getDebtHandler);

debtsRouter.openapi(updateDebtRoute, updateDebtHandler);

debtsRouter.openapi(deleteDebtRoute, deleteDebtHandler);

export default debtsRouter;
