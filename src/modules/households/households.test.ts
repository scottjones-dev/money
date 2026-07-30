import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter } from "@/lib/create-app";

import {
	createHouseholdHandler,
	getHouseholdHandler,
	listHouseholdsHandler,
} from "./households.handlers";
import {
	createHouseholdRoute,
	getHouseholdRoute,
	listHouseholdsRoute,
} from "./households.routes";
import { householdsService } from "./households.service";

vi.mock("./households.service", () => ({
	householdsService: {
		create: vi.fn(),
		list: vi.fn(),
		get: vi.fn(),
	},
}));

const mockedCreate = vi.mocked(householdsService.create);

const mockedList = vi.mocked(householdsService.list);

const mockedGet = vi.mocked(householdsService.get);

const exampleHousehold = {
	id: "074f1038-70b1-467e-b5c6-72d14c8fa659",
	organizationId: "org_123",
	name: "Jones Household",
	currency: "GBP" as const,
	country: "GB" as const,
	postcodeArea: "SP4",
	role: "owner",
	createdAt: "2026-07-30T16:00:00.000Z",
	updatedAt: "2026-07-30T16:00:00.000Z",
};

function createAuthenticatedTestApp() {
	const app = createRouter();

	app.use("*", async (context, next) => {
		context.set("requestId", "test-request-id");

		context.set("logger", {
			child: vi.fn(),
		} as never);

		context.set("user", {
			id: "user_123",
			name: "Scott Jones",
			email: "scott@example.com",
			emailVerified: true,
			image: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		context.set("session", {
			id: "session_123",
			userId: "user_123",
			token: "session-token",
			expiresAt: new Date(Date.now() + 60_000),
			createdAt: new Date(),
			updatedAt: new Date(),
			ipAddress: null,
			userAgent: null,
		});

		context.set("household", null);

		await next();
	});

	app.openapi(createHouseholdRoute, createHouseholdHandler);

	app.openapi(listHouseholdsRoute, listHouseholdsHandler);

	app.openapi(getHouseholdRoute, getHouseholdHandler);

	return app;
}

describe("household routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a household", async () => {
		mockedCreate.mockResolvedValue(exampleHousehold);

		const app = createAuthenticatedTestApp();

		const response = await app.request("/", {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				name: "Jones Household",
				postcodeArea: "sp4",
			}),
		});

		expect(response.status).toBe(201);

		const body = await response.json();

		expect(body).toEqual(exampleHousehold);

		expect(mockedCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user_123",
				data: {
					name: "Jones Household",
					postcodeArea: "SP4",
				},
			}),
		);
	});

	it("lists accessible households", async () => {
		mockedList.mockResolvedValue([exampleHousehold]);

		const app = createAuthenticatedTestApp();

		const response = await app.request("/");

		expect(response.status).toBe(200);

		const body = await response.json();

		expect(body).toEqual([exampleHousehold]);

		expect(mockedList).toHaveBeenCalledWith("user_123");
	});

	it("returns a household", async () => {
		mockedGet.mockResolvedValue(exampleHousehold);

		const app = createAuthenticatedTestApp();

		const response = await app.request(`/${exampleHousehold.id}`);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(exampleHousehold);
	});

	it("returns 404 for an inaccessible household", async () => {
		mockedGet.mockResolvedValue(null);

		const app = createAuthenticatedTestApp();

		const response = await app.request("/074f1038-70b1-467e-b5c6-72d14c8fa659");

		expect(response.status).toBe(404);

		expect(await response.json()).toEqual({
			error: {
				code: "HOUSEHOLD_NOT_FOUND",
				message: "The household could not be found.",
				requestId: "test-request-id",
			},
		});
	});

	it("rejects an invalid household UUID", async () => {
		const app = createAuthenticatedTestApp();

		const response = await app.request("/not-a-valid-uuid");

		expect(response.status).toBe(422);
	});
});
