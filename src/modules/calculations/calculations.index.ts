import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import * as h from "./calculations.handlers";
import * as r from "./calculations.routes";

const router = createRouter();
router.use("*", householdAccessMiddleware);
router.openapi(r.previewCalculationRoute, h.previewCalculationHandler);
router.openapi(r.listCalculationsRoute, h.listCalculationsHandler);
router.openapi(r.getCalculationRoute, h.getCalculationHandler);
router.openapi(r.deleteCalculationRoute, h.deleteCalculationHandler);
router.openapi(r.commitCalculationRoute, h.commitCalculationHandler);
export default router;
