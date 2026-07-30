// src/modules/health/health.index.ts
import { createRouter } from "@/lib/create-app";

import { healthHandler } from "./health.handlers";
import { healthRoute } from "./health.routes";

const router = createRouter();

router.openapi(healthRoute, healthHandler);

export default router;
