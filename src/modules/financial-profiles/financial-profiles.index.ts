import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import * as h from "./financial-profiles.handlers";
import * as r from "./financial-profiles.routes";

const router = createRouter();
router.use("*", householdAccessMiddleware);
router.openapi(r.createEmploymentRoute, h.createEmploymentHandler);
router.openapi(r.listEmploymentRoute, h.listEmploymentHandler);
router.openapi(r.getEmploymentRoute, h.getEmploymentHandler);
router.openapi(r.updateEmploymentRoute, h.updateEmploymentHandler);
router.openapi(r.deleteEmploymentRoute, h.deleteEmploymentHandler);
router.openapi(r.createPensionRoute, h.createPensionHandler);
router.openapi(r.listPensionsRoute, h.listPensionsHandler);
router.openapi(r.getPensionRoute, h.getPensionHandler);
router.openapi(r.updatePensionRoute, h.updatePensionHandler);
router.openapi(r.deletePensionRoute, h.deletePensionHandler);
export default router;
