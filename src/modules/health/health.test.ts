// src/modules/health/health.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter } from "@/lib/create-app";

import { healthHandler } from "./health.handlers";
import { healthRepository } from "./health.repository";
import { healthRoute } from "./health.routes";

vi.mock("./health.repository", () => ({
	healthRepository: {
		checkDatabase: vi.fn(),
		checkRedis: vi.fn(),
	},
}));

const mockedCheckDatabase = vi.mocked(healthRepository.checkDatabase);
const mockedCheckRedis = vi.mocked(healthRepository.checkRedis);

function createTestApp() {
	const app = createRouter();

	app.openapi(healthRoute, healthHandler);

	return app;
}

describe("GET /", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedCheckRedis.mockResolvedValue({ status: "disabled", latencyMs: 0 });
	});

	it("returns 200 when the database is available", async () => {
		mockedCheckDatabase.mockResolvedValue({
			status: "up",
			latencyMs: 2,
		});

		const app = createTestApp();
		const response = await app.request("/");

		expect(response.status).toBe(200);

		const body = await response.json();

		expect(body.status).toBe("ok");
		expect(body.dependencies.database.status).toBe("up");
		expect(body.dependencies.redis.status).toBe("disabled");
	});

	it("returns 503 when the database is unavailable", async () => {
		mockedCheckDatabase.mockResolvedValue({
			status: "down",
			latencyMs: 10,
		});

		const app = createTestApp();
		const response = await app.request("/");

		expect(response.status).toBe(503);

		const body = await response.json();

		expect(body.status).toBe("degraded");
		expect(body.dependencies.database.status).toBe("down");
	});
});
