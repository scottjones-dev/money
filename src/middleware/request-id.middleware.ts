// src/middleware/request-id.middleware.ts
import { createMiddleware } from "hono/factory";

import type { AppBindings } from "@/types/app";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;

function resolveRequestId(value: string | undefined): string {
	const requestId = value?.trim();

	if (requestId && REQUEST_ID_PATTERN.test(requestId)) {
		return requestId;
	}

	return crypto.randomUUID();
}

export const requestIdMiddleware = createMiddleware<AppBindings>(
	async (context, next) => {
		const requestId = resolveRequestId(
			context.req.header("x-request-id"),
		);

		context.set("requestId", requestId);
		context.header("x-request-id", requestId);

		await next();
	},
);