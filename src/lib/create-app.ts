// src/lib/create-app.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { defaultHook } from "stoker/openapi";

import { logger } from "@/lib/logger";
import { requestIdMiddleware } from "@/middleware/request-id.middleware";
import { AppError } from "@/shared/errors/app-error";
import type { AppBindings, AppOpenAPI } from "@/types/app";

export function createRouter(): AppOpenAPI {
	return new OpenAPIHono<AppBindings>({
		strict: false,
		defaultHook,
	});
}

export default function createApp(): AppOpenAPI {
	const app = createRouter();

	app.use("*", secureHeaders());

	app.use(
		"*",
		cors({
			origin: (origin) => origin,
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

	app.onError((error, context) => {
		const requestId = context.get("requestId") ?? crypto.randomUUID();

		if (error instanceof AppError) {
			context.get("logger")?.warn(
				{
					code: error.code,
					statusCode: error.statusCode,
					details: error.details,
				},
				error.message,
			);

			return context.json(
				{
					error: {
						code: error.code,
						message: error.message,
						requestId,
					},
				},
				error.statusCode as 400 | 401 | 403 | 404 | 409 | 422,
			);
		}

		context.get("logger")?.error(
			{
				error,
			},
			"Unhandled application error",
		);

		return context.json(
			{
				error: {
					code: "INTERNAL_SERVER_ERROR",
					message: "An unexpected error occurred.",
					requestId,
				},
			},
			500,
		);
	});

	return app;
}
