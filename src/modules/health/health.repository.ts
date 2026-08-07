// src/modules/health/health.repository.ts
import { pool } from "@/lib/database";
import { ensureRedisConnected, redis } from "@/lib/redis";

export interface DatabaseHealth {
	status: "up" | "down" | "disabled";
	latencyMs: number;
}

export const healthRepository = {
	async checkDatabase(): Promise<DatabaseHealth> {
		const startedAt = performance.now();

		try {
			await pool.query("select 1");

			return {
				status: "up",
				latencyMs: Math.round(performance.now() - startedAt),
			};
		} catch {
			return {
				status: "down",
				latencyMs: Math.round(performance.now() - startedAt),
			};
		}
	},

	async checkRedis(): Promise<DatabaseHealth> {
		const startedAt = performance.now();

		if (!redis) {
			return { status: "disabled", latencyMs: 0 };
		}

		try {
			await ensureRedisConnected();
			await redis.ping();

			return {
				status: "up",
				latencyMs: Math.round(performance.now() - startedAt),
			};
		} catch {
			return {
				status: "down",
				latencyMs: Math.round(performance.now() - startedAt),
			};
		}
	},
};
