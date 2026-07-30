// src/modules/health/health.service.ts
import { API_VERSION } from "@/lib/constants";

import { healthRepository } from "./health.repository";
import type { HealthResponse } from "./health.schemas";

export const healthService = {
	async getHealth(): Promise<HealthResponse> {
		const database = await healthRepository.checkDatabase();

		return {
			status: database.status === "up" ? "ok" : "degraded",
			service: "uk-finance-api",
			version: API_VERSION,
			timestamp: new Date().toISOString(),
			uptimeSeconds: Math.floor(process.uptime()),
			dependencies: {
				database,
			},
		};
	},
};
