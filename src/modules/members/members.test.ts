import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter } from "@/lib/create-app";

import membersRouter from "./members.index";
import { membersService } from "./members.service";

vi.mock("@/middleware/household-access.middleware", () => ({
	householdAccessMiddleware: async (
		context: {
			set: (key: string, value: unknown) => void;
			req: {
				param: (name: string) => string | undefined;
			};
		},
		next: () => Promise<void>,
	) => {
		const householdId = context.req.param("householdId");

		context.set("requestId", "test-request-id");
		context.set("user", {
			id: "user_123",
			name: "Scott Jones",
			email: "scott@example.com",
		});
		context.set("session", null);
		context.set("household", {
			id: householdId,
			organizationId: "organization_123",
			name: "Jones Household",
			role: "owner",
		});

		await next();
	},
}));

vi.mock("./members.service", () => ({
	membersService: {
		create: vi.fn(),
		list: vi.fn(),
		get: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
}));

const mockedCreate = vi.mocked(membersService.create);
const mockedList = vi.mocked(membersService.list);
const mockedGet = vi.mocked(membersService.get);
const mockedUpdate = vi.mocked(membersService.update);
const mockedDelete = vi.mocked(membersService.delete);

const householdId = "074f1038-70b1-467e-b5c6-72d14c8fa659";

const memberId = "71d08e2c-e6fe-4954-b589-e6581c4a955e";

const exampleMember = {
	id: memberId,
	householdId,
	authUserId: "user_123",
	firstName: "Scott",
	lastName: "Jones",
	memberType: "adult" as const,
	relationship: "self" as const,
	dateOfBirth: "1995-05-10",
	isClaimant: true,
	isPartner: false,
	isDependent: false,
	employmentStatus: "employed" as const,
	isStudent: false,
	hasDisability: false,
	createdAt: "2026-07-30T17:00:00.000Z",
	updatedAt: "2026-07-30T17:00:00.000Z",
};

function createTestApp() {
	const app = createRouter();

	app.route("/v1/households/:householdId/members", membersRouter);

	return app;
}

describe("household member routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("creates a household member", async () => {
		mockedCreate.mockResolvedValue(exampleMember);

		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/members`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					firstName: "Scott",
					lastName: "Jones",
					authUserId: "user_123",
					memberType: "adult",
					relationship: "self",
					dateOfBirth: "1995-05-10",
					isClaimant: true,
					employmentStatus: "employed",
				}),
			},
		);

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual(exampleMember);

		expect(mockedCreate).toHaveBeenCalledWith({
			householdId,
			role: "owner",
			data: expect.objectContaining({
				firstName: "Scott",
				relationship: "self",
				isClaimant: true,
			}),
		});
	});

	it("lists household members", async () => {
		const listResponse = {
			data: [exampleMember],
			pagination: {
				page: 1,
				pageSize: 20,
				totalItems: 1,
				totalPages: 1,
				hasPreviousPage: false,
				hasNextPage: false,
			},
		};
		mockedList.mockResolvedValue(listResponse);

		const app = createTestApp();

		const response = await app.request(`/v1/households/${householdId}/members`);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(listResponse);
		expect(mockedList).toHaveBeenCalledWith({
			householdId,
			query: { page: 1, pageSize: 20 },
		});
	});

	it("returns one household member", async () => {
		mockedGet.mockResolvedValue(exampleMember);

		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/members/${memberId}`,
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(exampleMember);
	});

	it("returns 404 when the member does not exist", async () => {
		mockedGet.mockResolvedValue(null);

		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/members/${memberId}`,
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			error: {
				code: "HOUSEHOLD_MEMBER_NOT_FOUND",
				message: "The household member could not be found.",
				requestId: "test-request-id",
			},
		});
	});

	it("updates a household member", async () => {
		mockedUpdate.mockResolvedValue({
			...exampleMember,
			firstName: "Scottie",
		});

		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/members/${memberId}`,
			{
				method: "PATCH",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					firstName: "Scottie",
				}),
			},
		);

		expect(response.status).toBe(200);

		expect(mockedUpdate).toHaveBeenCalledWith({
			householdId,
			memberId,
			role: "owner",
			data: expect.objectContaining({
				firstName: "Scottie",
			}),
		});
	});

	it("deletes a household member", async () => {
		mockedDelete.mockResolvedValue({
			deletedMemberId: memberId,
		});

		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/members/${memberId}`,
			{
				method: "DELETE",
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			success: true,
			deletedMemberId: memberId,
		});
	});

	it("rejects an invalid member ID", async () => {
		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/members/not-a-uuid`,
		);

		expect(response.status).toBe(422);
	});

	it("rejects an invalid child configuration", async () => {
		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/members`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					firstName: "Alex",
					memberType: "child",
					relationship: "partner",
					isPartner: true,
				}),
			},
		);

		expect(response.status).toBe(422);
		expect(mockedCreate).not.toHaveBeenCalled();
	});
});
