// src/modules/affordability/affordability.index.ts
import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import { calculationRateLimitMiddleware } from "@/middleware/rate-limit.middleware";

import { calculateAffordabilityHandler } from "./affordability.handlers";
import { calculateAffordabilityRoute } from "./affordability.routes";

const affordabilityRouter = createRouter();

affordabilityRouter.use("*", householdAccessMiddleware);
affordabilityRouter.use("*", calculationRateLimitMiddleware);

affordabilityRouter.openapi(
	calculateAffordabilityRoute,
	calculateAffordabilityHandler,
);

export default affordabilityRouter;
