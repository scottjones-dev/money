import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { GenericContainer } from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let container: Awaited<ReturnType<GenericContainer["start"]>>;
let firstClient: Redis;
let secondClient: Redis;

describe("Redis rate limiting", () => {
	beforeAll(async () => {
		container = await new GenericContainer("redis:7-alpine")
			.withExposedPorts(6379)
			.start();
		const url = `redis://${container.getHost()}:${container.getMappedPort(6379)}`;
		firstClient = new Redis(url);
		secondClient = new Redis(url);
		await Promise.all([firstClient.ping(), secondClient.ping()]);
	});

	afterAll(async () => {
		await Promise.all([firstClient?.quit(), secondClient?.quit()]);
		await container?.stop();
	});

	it("shares counters between API instances", async () => {
		const options = {
			points: 2,
			duration: 60,
			keyPrefix: `integration-${crypto.randomUUID()}`,
			useRedisPackage: true,
		};
		const first = new RateLimiterRedis({
			...options,
			storeClient: firstClient,
		});
		const second = new RateLimiterRedis({
			...options,
			storeClient: secondClient,
		});

		await first.consume("shared-client");
		await second.consume("shared-client");

		await expect(first.consume("shared-client")).rejects.toMatchObject({
			remainingPoints: 0,
		});
	});
});
