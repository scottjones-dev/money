// src/modules/affordability/affordability.index.ts
import { OpenAPIHono } from "@hono/zod-openapi";

import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import type { AppBindings } from "@/types/app";

import { calculateAffordabilityHandler } from "./affordability.handlers";
import { calculateAffordabilityRoute } from "./affordability.routes";

const affordabilityRouter = new OpenAPIHono<AppBindings>();

affordabilityRouter.use("*", householdAccessMiddleware);

affordabilityRouter.openapi(
	calculateAffordabilityRoute,
	calculateAffordabilityHandler,
);

export default affordabilityRouter;
