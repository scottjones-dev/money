// src/shared/errors/app-error.ts
import type { ErrorCode } from "./error-codes";

export type AppErrorStatus =
	| 400
	| 401
	| 403
	| 404
	| 409
	| 422
	| 429
	| 500
	| 503;

export interface AppErrorDetail {
	field?: string;
	code?: string;
	message: string;
	value?: unknown;
}

export interface AppErrorOptions {
	code: ErrorCode;
	message: string;
	statusCode: AppErrorStatus;

	details?: AppErrorDetail[];

	cause?: unknown;

	/**
	 * Marks whether the message is safe to return to API consumers.
	 *
	 * Internal failures should generally use false so the HTTP layer can
	 * return a generic message while logging the original error.
	 */
	expose?: boolean;
}

export class AppError extends Error {
	readonly code: ErrorCode;

	readonly statusCode: AppErrorStatus;

	readonly details?: AppErrorDetail[];

	readonly expose: boolean;

	constructor(options: AppErrorOptions) {
		super(options.message, {
			cause: options.cause,
		});

		this.name = "AppError";
		this.code = options.code;
		this.statusCode = options.statusCode;
		this.details = options.details;
		this.expose = options.expose ?? options.statusCode < 500;

		Object.setPrototypeOf(this, new.target.prototype);
	}

	toJSON(): {
		code: ErrorCode;
		message: string;
		details?: AppErrorDetail[];
	} {
		return {
			code: this.code,
			message: this.message,
			...(this.details
				? {
						details: this.details,
					}
				: {}),
		};
	}
}

export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}

export function toAppError(
	error: unknown,
	fallback: {
		code: ErrorCode;
		message: string;
		statusCode?: AppErrorStatus;
	},
): AppError {
	if (isAppError(error)) {
		return error;
	}

	return new AppError({
		code: fallback.code,
		message: fallback.message,
		statusCode: fallback.statusCode ?? 500,
		cause: error,
		expose: false,
	});
}
