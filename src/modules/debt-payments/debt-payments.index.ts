import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import {
	createDebtPaymentHandler,
	deleteDebtPaymentHandler,
	getDebtPaymentHandler,
	listDebtPaymentsHandler,
	updateDebtPaymentHandler,
} from "./debt-payments.handlers";
import {
	createDebtPaymentRoute,
	deleteDebtPaymentRoute,
	getDebtPaymentRoute,
	listDebtPaymentsRoute,
	updateDebtPaymentRoute,
} from "./debt-payments.routes";

const router = createRouter();
router.use("*", householdAccessMiddleware);
router.openapi(createDebtPaymentRoute, createDebtPaymentHandler);
router.openapi(listDebtPaymentsRoute, listDebtPaymentsHandler);
router.openapi(getDebtPaymentRoute, getDebtPaymentHandler);
router.openapi(updateDebtPaymentRoute, updateDebtPaymentHandler);
router.openapi(deleteDebtPaymentRoute, deleteDebtPaymentHandler);
export default router;
