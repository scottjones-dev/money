// src/modules/health/health.schemas.ts
import { z } from "@hono/zod-openapi";

export const dependencyHealthSchema = z
	.object({
		status: z.enum(["up", "down"]),
		latencyMs: z.number().int().nonnegative(),
	})
	.openapi("DependencyHealth");

export const healthResponseSchema = z
	.object({
		status: z.enum(["ok", "degraded"]),
		service: z.literal("uk-finance-api"),
		version: z.string(),
		timestamp: z.iso.datetime(),
		uptimeSeconds: z.number().nonnegative(),
		dependencies: z.object({
			database: dependencyHealthSchema,
		}),
	})
	.openapi("HealthResponse");

export type HealthResponse = z.infer<typeof healthResponseSchema>;
