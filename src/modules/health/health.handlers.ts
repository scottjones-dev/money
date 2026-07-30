// src/modules/health/health.handlers.ts
import type { AppRouteHandler } from "@/types/app";
import type { healthRoute } from "./health.routes";
import { healthService } from "./health.service";

export const healthHandler: AppRouteHandler<typeof healthRoute> = async (
	context,
) => {
	const result = await healthService.getHealth();

	if (result.status === "degraded") {
		return context.json(result, 503);
	}

	return context.json(result, 200);
};
