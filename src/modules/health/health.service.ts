// src/modules/health/health.service.ts
import { API_VERSION } from "@/lib/constants";

import { healthRepository } from "./health.repository";
import type { HealthResponse } from "./health.schemas";

export const healthService = {
	async getHealth(): Promise<HealthResponse> {
		const [database, redis] = await Promise.all([
			healthRepository.checkDatabase(),
			healthRepository.checkRedis(),
		]);

		return {
			status:
				database.status === "up" && redis.status !== "down" ? "ok" : "degraded",
			service: "uk-finance-api",
			version: API_VERSION,
			timestamp: new Date().toISOString(),
			uptimeSeconds: Math.floor(process.uptime()),
			dependencies: {
				database,
				redis,
			},
		};
	},
};
