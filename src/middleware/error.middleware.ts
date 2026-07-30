// src/middleware/error.middleware.ts
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

import {
	AppError,
	isAppError,
	type AppErrorStatus,
} from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import type { AppBindings } from "@/types/app";

const SAFE_HTTP_STATUSES = new Set<AppErrorStatus>([
	400,
	401,
	403,
	404,
	409,
	422,
	429,
	500,
	503,
]);

function resolveRequestId(
	context: Parameters<ErrorHandler<AppBindings>>[1],
): string {
	return context.get("requestId") ?? crypto.randomUUID();
}

function logApplicationError(
	error: AppError,
	context: Parameters<ErrorHandler<AppBindings>>[1],
	requestId: string,
): void {
	const logger = context.get("logger");

	const payload = {
		requestId,
		code: error.code,
		statusCode: error.statusCode,
		method: context.req.method,
		path: context.req.path,
		details: error.details,
		cause: error.cause,
	};

	if (error.statusCode >= 500) {
		logger?.error(payload, error.message);
		return;
	}

	logger?.warn(payload, error.message);
}

function createAppErrorResponse(
	error: AppError,
	requestId: string,
) {
	return {
		error: {
			code: error.code,
			message: error.expose
				? error.message
				: "An unexpected error occurred.",
			requestId,
			...(error.expose && error.details
				? {
						details: error.details.map((detail) => ({
							...(detail.field
								? { field: detail.field }
								: {}),
							message: detail.message,
						})),
					}
				: {}),
		},
	};
}

export const errorHandler: ErrorHandler<AppBindings> = (
	error,
	context,
) => {
	const requestId = resolveRequestId(context);

	if (isAppError(error)) {
		logApplicationError(error, context, requestId);

		const statusCode = SAFE_HTTP_STATUSES.has(
			error.statusCode,
		)
			? error.statusCode
			: 500;

		return context.json(
			createAppErrorResponse(error, requestId),
			statusCode,
		);
	}

	if (error instanceof HTTPException) {
		context.get("logger")?.warn(
			{
				requestId,
				statusCode: error.status,
				method: context.req.method,
				path: context.req.path,
				cause: error.cause,
			},
			error.message,
		);

		return context.json(
			{
				error: {
					code:
						error.status === 404
							? ERROR_CODES.RESOURCE_NOT_FOUND
							: ERROR_CODES.INTERNAL_SERVER_ERROR,
					message:
						error.status >= 500
							? "An unexpected error occurred."
							: error.message,
					requestId,
				},
			},
			error.status,
		);
	}

	context.get("logger")?.error(
		{
			requestId,
			error,
			method: context.req.method,
			path: context.req.path,
		},
		"Unhandled application error",
	);

	return context.json(
		{
			error: {
				code: ERROR_CODES.INTERNAL_SERVER_ERROR,
				message: "An unexpected error occurred.",
				requestId,
			},
		},
		500,
	);
};