// src/modules/health/health.repository.ts
import { pool } from "@/lib/database";

export interface DatabaseHealth {
	status: "up" | "down";
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
};