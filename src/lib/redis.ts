import Redis from "ioredis";

import { env } from "@/env";
import { logger } from "@/lib/logger";

export const redis = env.REDIS_URL
	? new Redis(env.REDIS_URL, {
			lazyConnect: true,
			maxRetriesPerRequest: 1,
			enableOfflineQueue: false,
		})
	: null;

redis?.on("error", (error) => {
	logger.error({ error }, "Redis connection error");
});

export async function ensureRedisConnected(): Promise<void> {
	if (!redis || redis.status === "ready") {
		return;
	}

	if (redis.status === "wait") {
		await redis.connect();
	}
}

export async function closeRedis(): Promise<void> {
	if (!redis) {
		return;
	}

	if (redis.status === "ready") {
		await redis.quit();
		return;
	}

	redis.disconnect();
}
