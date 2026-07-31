import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Expense, HouseholdMember } from "@/db/schema";
import type { AppBindings } from "@/types/app";

const mocks = vi.hoisted(() => ({
	findHouseholdMembership: vi.fn(),

	findMember: vi.fn(),
	findById: vi.fn(),
	list: vi.fn(),
	count: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	delete: vi.fn(),
}));

vi.mock("@/modules/households/households.repository", () => ({
	householdsRepository: {
		findMembership: mocks.findHouseholdMembership,
	},
}));

vi.mock("@/modules/expenses/expenses.repository", () => ({
	expensesRepository: {
		findMember: mocks.findMember,
		findById: mocks.findById,
		list: mocks.list,
		count: mocks.count,
		create: mocks.create,
		update: mocks.update,
		delete: mocks.delete,
	},
}));

import { errorHandler } from "@/middleware/error.middleware";
import expensesRouter from "./expenses.index";

const householdId = "11111111-1111-4111-8111-111111111111";

const otherHouseholdId = "22222222-2222-4222-8222-222222222222";

const memberId = "33333333-3333-4333-8333-333333333333";

const otherMemberId = "44444444-4444-4444-8444-444444444444";

const expenseId = "55555555-5555-4555-8555-555555555555";

const requestId = "66666666-6666-4666-8666-666666666666";

const createdAt = new Date("2026-07-30T18:00:00.000Z");

const updatedAt = new Date("2026-07-30T18:30:00.000Z");

const householdMembership = {
	id: householdId,
	organizationId: "organization-1",
	name: "Jones household",
	role: "owner" as const,
};

const householdMember: HouseholdMember = {
	id: memberId,
	householdId,
	authUserId: "user-1",
	firstName: "Scott",
	lastName: "Jones",
	memberType: "adult",
	relationship: "self",
	dateOfBirth: "1995-01-01",
	isClaimant: true,
	isPartner: false,
	isDependent: false,
	employmentStatus: "employed",
	isStudent: false,
	hasDisability: false,
	createdAt,
	updatedAt,
};

const expense: Expense = {
	id: expenseId,
	householdId,
	memberId,
	category: "housing",
	priority: "essential",
	name: "Rent",
	amount: "1200.00",
	frequency: "monthly",
	paymentMethod: "direct_debit",
	paymentDueDay: "1",
	startDate: "2026-01-01",
	endDate: null,
	isActive: true,
	isFixed: true,
	isHouseholdExpense: true,
	includeInBudget: true,
	payee: "Landlord",
	accountReferenceEncrypted: null,
	accountReferenceHash: null,
	notes: null,
	createdAt,
	updatedAt,
};

function createTestApp(input?: { authenticated?: boolean }) {
	const app = new OpenAPIHono<AppBindings>();

	app.use("*", async (context, next) => {
		context.set("requestId", requestId);

		context.set(
			"user",
			input?.authenticated === false
				? null
				: ({
						id: "user-1",
						name: "Scott Jones",
						email: "scott@example.com",
						emailVerified: true,
						image: null,
						createdAt,
						updatedAt,
					} as never),
		);

		context.set("session", null);
		context.set("household", null);

		await next();
	});

	app.route("/v1/households/:householdId/expenses", expensesRouter);

	app.onError(errorHandler);

	return app;
}

function expensesUrl(id: string = householdId): string {
	return `/v1/households/${id}/expenses`;
}

function expenseUrl(id: string = expenseId): string {
	return `${expensesUrl()}/${id}`;
}

describe("expenses", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mocks.findHouseholdMembership.mockResolvedValue(householdMembership);

		mocks.findMember.mockResolvedValue(householdMember);

		mocks.findById.mockResolvedValue(expense);

		mocks.list.mockResolvedValue([expense]);

		mocks.count.mockResolvedValue(1);

		mocks.create.mockResolvedValue(expense);

		mocks.update.mockResolvedValue({
			...expense,
			name: "Updated rent",
		});

		mocks.delete.mockResolvedValue(true);
	});

	it("rejects unauthenticated requests", async () => {
		const app = createTestApp({
			authenticated: false,
		});

		const response = await app.request(expensesUrl());

		expect(response.status).toBe(401);

		await expect(response.json()).resolves.toEqual({
			error: {
				code: "AUTHENTICATION_REQUIRED",
				message: "Authentication is required.",
				requestId,
			},
		});

		expect(mocks.findHouseholdMembership).not.toHaveBeenCalled();
	});

	it("returns 404 when the user cannot access the household", async () => {
		mocks.findHouseholdMembership.mockResolvedValue(null);

		const app = createTestApp();

		const response = await app.request(expensesUrl(otherHouseholdId));

		expect(response.status).toBe(404);

		await expect(response.json()).resolves.toEqual({
			error: {
				code: "HOUSEHOLD_NOT_FOUND",
				message: "The household could not be found.",
				requestId,
			},
		});
	});

	it("lists household expenses", async () => {
		const app = createTestApp();

		const response = await app.request(`${expensesUrl()}?page=1&pageSize=25`);

		expect(response.status).toBe(200);

		const body = await response.json();

		expect(body).toEqual({
			items: [
				{
					id: expenseId,
					householdId,
					memberId,
					category: "housing",
					priority: "essential",
					name: "Rent",
					amount: "1200.00",
					frequency: "monthly",
					paymentMethod: "direct_debit",
					paymentDueDay: 1,
					startDate: "2026-01-01",
					endDate: null,
					isActive: true,
					isFixed: true,
					isHouseholdExpense: true,
					includeInBudget: true,
					payee: "Landlord",
					notes: null,
					normalised: {
						weekly: "276.92",
						monthly: "1200.00",
						yearly: "14400.00",
					},
					createdAt: "2026-07-30T18:00:00.000Z",
					updatedAt: "2026-07-30T18:30:00.000Z",
				},
			],
			meta: {
				page: 1,
				pageSize: 25,
				total: 1,
				totalPages: 1,
			},
		});

		expect(mocks.list).toHaveBeenCalledWith({
			householdId,
			memberId: undefined,
			category: undefined,
			priority: undefined,
			isActive: undefined,
			includeInBudget: undefined,
			limit: 25,
			offset: 0,
		});
	});

	it("passes list filters to the repository", async () => {
		mocks.list.mockResolvedValue([]);
		mocks.count.mockResolvedValue(0);

		const app = createTestApp();

		const response = await app.request(
			`${expensesUrl()}?memberId=${memberId}&category=housing&priority=essential&isActive=true&includeInBudget=true&page=2&pageSize=10`,
		);

		expect(response.status).toBe(200);

		expect(mocks.list).toHaveBeenCalledWith({
			householdId,
			memberId,
			category: "housing",
			priority: "essential",
			isActive: true,
			includeInBudget: true,
			limit: 10,
			offset: 10,
		});
	});

	it("gets one expense", async () => {
		const app = createTestApp();

		const response = await app.request(expenseUrl());

		expect(response.status).toBe(200);

		const body = await response.json();

		expect(body.id).toBe(expenseId);
		expect(body.normalised).toEqual({
			weekly: "276.92",
			monthly: "1200.00",
			yearly: "14400.00",
		});

		expect(mocks.findById).toHaveBeenCalledWith({
			householdId,
			expenseId,
		});
	});

	it("returns 404 for a missing expense", async () => {
		mocks.findById.mockResolvedValue(null);

		const app = createTestApp();

		const response = await app.request(expenseUrl());

		expect(response.status).toBe(404);

		const body = await response.json();

		expect(body.error.code).toBe("EXPENSE_NOT_FOUND");
	});

	it("creates an expense for an owner", async () => {
		const app = createTestApp();

		const response = await app.request(expensesUrl(), {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				memberId,
				category: "housing",
				priority: "essential",
				name: "Rent",
				amount: "1200",
				frequency: "monthly",
				paymentMethod: "direct_debit",
				paymentDueDay: 1,
				startDate: "2026-01-01",
				isFixed: true,
				payee: "Landlord",
			}),
		});

		expect(response.status).toBe(201);

		expect(mocks.findMember).toHaveBeenCalledWith({
			householdId,
			memberId,
		});

		expect(mocks.create).toHaveBeenCalledWith({
			householdId,
			memberId,
			category: "housing",
			priority: "essential",
			name: "Rent",
			amount: "1200.00",
			frequency: "monthly",
			paymentMethod: "direct_debit",
			paymentDueDay: "1",
			startDate: "2026-01-01",
			endDate: null,
			isActive: true,
			isFixed: true,
			isHouseholdExpense: true,
			includeInBudget: true,
			payee: "Landlord",
			notes: null,
		});
	});

	it("prevents a viewer from creating an expense", async () => {
		mocks.findHouseholdMembership.mockResolvedValue({
			...householdMembership,
			role: "viewer",
		});

		const app = createTestApp();

		const response = await app.request(expensesUrl(), {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				category: "food",
				name: "Groceries",
				amount: "100.00",
				frequency: "weekly",
			}),
		});

		expect(response.status).toBe(403);

		const body = await response.json();

		expect(body.error.code).toBe("INSUFFICIENT_HOUSEHOLD_PERMISSION");

		expect(mocks.create).not.toHaveBeenCalled();
	});

	it("rejects a member from another household", async () => {
		mocks.findMember.mockResolvedValue(null);

		const app = createTestApp();

		const response = await app.request(expensesUrl(), {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				memberId: otherMemberId,
				category: "food",
				name: "Groceries",
				amount: "100.00",
				frequency: "weekly",
			}),
		});

		expect(response.status).toBe(404);

		const body = await response.json();

		expect(body.error.code).toBe("HOUSEHOLD_MEMBER_NOT_FOUND");

		expect(mocks.create).not.toHaveBeenCalled();
	});

	it("rejects an end date before the start date", async () => {
		const app = createTestApp();

		const response = await app.request(expensesUrl(), {
			method: "POST",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				category: "housing",
				name: "Rent",
				amount: "1200.00",
				frequency: "monthly",
				startDate: "2026-07-01",
				endDate: "2026-06-30",
			}),
		});

		expect(response.status).toBe(422);

		const body = await response.json();

		expect(body.error.code).toBe("INVALID_DATE_RANGE");

		expect(mocks.create).not.toHaveBeenCalled();
	});

	it("updates an expense", async () => {
		const app = createTestApp();

		const response = await app.request(expenseUrl(), {
			method: "PATCH",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				name: "Updated rent",
				amount: "1250",
				paymentDueDay: 2,
			}),
		});

		expect(response.status).toBe(200);

		const body = await response.json();

		expect(body.name).toBe("Updated rent");

		expect(mocks.update).toHaveBeenCalledWith({
			householdId,
			expenseId,
			values: {
				name: "Updated rent",
				amount: "1250.00",
				paymentDueDay: "2",
			},
		});
	});

	it("prevents a viewer from updating an expense", async () => {
		mocks.findHouseholdMembership.mockResolvedValue({
			...householdMembership,
			role: "viewer",
		});

		const app = createTestApp();

		const response = await app.request(expenseUrl(), {
			method: "PATCH",
			headers: {
				"content-type": "application/json",
			},
			body: JSON.stringify({
				name: "Blocked update",
			}),
		});

		expect(response.status).toBe(403);

		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("deletes an expense within the household", async () => {
		const app = createTestApp();

		const response = await app.request(expenseUrl(), {
			method: "DELETE",
		});

		expect(response.status).toBe(200);

		await expect(response.json()).resolves.toEqual({
			success: true,
		});

		expect(mocks.delete).toHaveBeenCalledWith({
			householdId,
			expenseId,
		});
	});
});
