// src/middleware/rate-limit.middleware.ts

import { createMiddleware } from "hono/factory";
import {
	RateLimiterMemory,
	RateLimiterRedis,
	type RateLimiterRes,
} from "rate-limiter-flexible";

import { redis } from "@/lib/redis";
import type { AppBindings } from "@/types/app";

export interface RateLimitOptions {
	/**
	 * Maximum number of consumed points during the duration.
	 */
	points: number;

	/**
	 * Duration of the rate-limit window in seconds.
	 */
	durationSeconds: number;

	/**
	 * Optional amount of time to block the key after it exceeds the limit.
	 */
	blockDurationSeconds?: number;

	/**
	 * Prefix used to separate independent limiter buckets.
	 */
	keyPrefix: string;

	/**
	 * Number of points consumed by each request.
	 */
	pointsToConsume?: number;

	/**
	 * Generates the identifier used for the rate-limit bucket.
	 */
	keyGenerator?: (
		context: Parameters<Parameters<typeof createMiddleware<AppBindings>>[0]>[0],
	) => string;
}

function getClientIp(
	context: Parameters<Parameters<typeof createMiddleware<AppBindings>>[0]>[0],
): string {
	/*
	 * Only trust these proxy headers when your reverse proxy is configured
	 * to overwrite them rather than pass arbitrary client values through.
	 */
	const cloudflareIp = context.req.header("cf-connecting-ip")?.trim();

	if (cloudflareIp) {
		return cloudflareIp;
	}

	return "unknown";
}

function defaultKeyGenerator(
	context: Parameters<Parameters<typeof createMiddleware<AppBindings>>[0]>[0],
): string {
	const user = context.get("user");

	if (user) {
		return `user:${user.id}`;
	}

	return `ip:${getClientIp(context)}`;
}

function isRateLimiterResponse(error: unknown): error is RateLimiterRes {
	return (
		typeof error === "object" &&
		error !== null &&
		"msBeforeNext" in error &&
		"remainingPoints" in error
	);
}

function secondsUntilReset(msBeforeNext: number): number {
	return Math.max(1, Math.ceil(msBeforeNext / 1_000));
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
	const limiterOptions = {
		points: options.points,
		duration: options.durationSeconds,
		blockDuration: options.blockDurationSeconds ?? 0,
		keyPrefix: options.keyPrefix,
	};
	const insuranceLimiter = new RateLimiterMemory(limiterOptions);
	const limiter = redis
		? new RateLimiterRedis({
				...limiterOptions,
				storeClient: redis,
				useRedisPackage: true,
				insuranceLimiter,
				rejectIfRedisNotReady: false,
			})
		: insuranceLimiter;

	return createMiddleware<AppBindings>(async (context, next) => {
		const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

		const key = keyGenerator(context);
		const pointsToConsume = options.pointsToConsume ?? 1;

		try {
			const result = await limiter.consume(key, pointsToConsume);

			const resetSeconds = secondsUntilReset(result.msBeforeNext);

			context.header("RateLimit-Limit", String(options.points));
			context.header(
				"RateLimit-Remaining",
				String(Math.max(0, result.remainingPoints)),
			);
			context.header("RateLimit-Reset", String(resetSeconds));

			await next();
		} catch (error: unknown) {
			if (!isRateLimiterResponse(error)) {
				throw error;
			}

			const retryAfter = secondsUntilReset(error.msBeforeNext);

			context.header("RateLimit-Limit", String(options.points));
			context.header("RateLimit-Remaining", "0");
			context.header("RateLimit-Reset", String(retryAfter));
			context.header("Retry-After", String(retryAfter));

			return context.json(
				{
					error: {
						code: "RATE_LIMIT_EXCEEDED",
						message: "Too many requests. Please try again later.",
						requestId: context.get("requestId"),
					},
				},
				429,
			);
		}
	});
}

/**
 * General protection for ordinary authenticated and public API routes.
 *
 * 120 requests per minute per authenticated user, falling back to IP.
 */
export const generalRateLimitMiddleware = createRateLimitMiddleware({
	keyPrefix: "general",
	points: 120,
	durationSeconds: 60,
});

/**
 * Stricter protection for login, registration and password-reset routes.
 *
 * 10 attempts within 15 minutes, followed by a 15-minute block.
 */
export const authenticationRateLimitMiddleware = createRateLimitMiddleware({
	keyPrefix: "authentication",
	points: 10,
	durationSeconds: 15 * 60,
	blockDurationSeconds: 15 * 60,

	/*
	 * Authentication requests normally have no session yet, so use the
	 * client IP rather than the authenticated-user fallback.
	 */
	keyGenerator: (context) => `ip:${getClientIp(context)}`,
});

/**
 * Protection for expensive financial calculations.
 */
export const calculationRateLimitMiddleware = createRateLimitMiddleware({
	keyPrefix: "calculations",
	points: 30,
	durationSeconds: 60,
});
