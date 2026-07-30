// src/middleware/request-id.middleware.ts
import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/types/app";

export const requestIdMiddleware = createMiddleware<AppBindings>(
	async (context, next) => {
		const suppliedRequestId = context.req.header("x-request-id");

		const requestId =
			suppliedRequestId?.trim() || crypto.randomUUID();

		context.set("requestId", requestId);
		context.header("x-request-id", requestId);

		await next();
	},
);