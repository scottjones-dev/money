import { describe, expect, it } from "vitest";

import createApp, { createRouter } from "@/lib/create-app";
import { createRateLimitMiddleware } from "@/middleware/rate-limit.middleware";

describe("HTTP security", () => {
	it("allows credentialed CORS only for configured origins", async () => {
		const app = createApp();
		app.get("/test", (context) => context.json({ ok: true }));

		const allowed = await app.request("/test", {
			headers: { Origin: "http://localhost:3000" },
		});
		const denied = await app.request("/test", {
			headers: { Origin: "https://untrusted.example" },
		});

		expect(allowed.headers.get("access-control-allow-origin")).toBe(
			"http://localhost:3000",
		);
		expect(allowed.headers.get("access-control-allow-credentials")).toBe(
			"true",
		);
		expect(denied.headers.get("access-control-allow-origin")).toBeNull();
	});

	it("ignores generic forwarded IP headers", async () => {
		const app = createRouter();
		app.use("*", async (context, next) => {
			context.set("requestId", "security-test");
			context.set("user", null);
			await next();
		});
		app.use(
			"*",
			createRateLimitMiddleware({
				keyPrefix: `security-test-${crypto.randomUUID()}`,
				points: 1,
				durationSeconds: 60,
			}),
		);
		app.get("/", (context) => context.json({ ok: true }));

		const first = await app.request("/", {
			headers: { "x-forwarded-for": "192.0.2.1" },
		});
		const second = await app.request("/", {
			headers: { "x-forwarded-for": "198.51.100.2" },
		});

		expect(first.status).toBe(200);
		expect(second.status).toBe(429);
	});
});
