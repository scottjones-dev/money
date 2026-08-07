// src/lib/create-app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { defaultHook } from "stoker/openapi";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import { errorHandler } from "@/middleware/error.middleware";
import { requestIdMiddleware } from "@/middleware/request-id.middleware";
import type { AppBindings, AppOpenAPI } from "@/types/app";

export function createRouter(): AppOpenAPI {
	return new OpenAPIHono<AppBindings>({
		strict: false,
		defaultHook,
	});
}

export default function createApp(): AppOpenAPI {
	const app = createRouter();
	const allowedOrigins = new Set(
		(
			env.CORS_ALLOWED_ORIGINS ??
			(env.NODE_ENV === "production"
				? ""
				: "http://localhost:3000,http://localhost:9000")
		)
			.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean),
	);

	app.use("*", secureHeaders());

	app.use(
		"*",
		cors({
			origin: (origin) => (allowedOrigins.has(origin) ? origin : undefined),
			allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			exposeHeaders: ["X-Request-ID"],
			credentials: true,
			maxAge: 600,
		}),
	);

	app.use("*", requestIdMiddleware);

	app.use("*", async (context, next) => {
		const requestLogger = logger.child({
			requestId: context.get("requestId"),
			method: context.req.method,
			path: context.req.path,
		});

		context.set("logger", requestLogger);

		const startedAt = performance.now();

		requestLogger.info("Request started");

		try {
			await next();
		} finally {
			requestLogger.info(
				{
					status: context.res.status,
					durationMs: Math.round(performance.now() - startedAt),
				},
				"Request completed",
			);
		}
	});

	app.notFound((context) => {
		return context.json(
			{
				error: {
					code: "RESOURCE_NOT_FOUND",
					message: "The requested endpoint does not exist.",
					requestId: context.get("requestId"),
				},
			},
			404,
		);
	});

	app.onError(errorHandler);

	return app;
}
