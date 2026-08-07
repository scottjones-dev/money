import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Debt } from "@/db/schema";

const mocks = vi.hoisted(() => ({
	list: vi.fn(),
	count: vi.fn(),
}));

vi.mock("./debts.repository", () => ({
	debtsRepository: {
		list: mocks.list,
		count: mocks.count,
	},
}));

vi.mock("@/modules/members/members.repository", () => ({
	membersRepository: { findById: vi.fn() },
}));

import { debtsService } from "./debts.service";

const debt: Debt = {
	id: "11111111-1111-4111-8111-111111111111",
	householdId: "22222222-2222-4222-8222-222222222222",
	memberId: null,
	type: "credit_card",
	status: "active",
	priority: "non_priority",
	repaymentStrategy: "minimum_only",
	name: "Credit card",
	creditorName: "Example Bank",
	accountReferenceEncrypted: null,
	accountReferenceHash: null,
	currentBalance: "1200.00",
	originalBalance: null,
	creditLimit: "2500.00",
	minimumPayment: "100.00",
	paymentFrequency: "weekly",
	plannedPayment: null,
	interestType: "variable",
	annualInterestRate: "24.9000",
	paymentDueDay: "15",
	startDate: null,
	expectedEndDate: null,
	settledAt: null,
	includeInSnowball: true,
	isSecured: false,
	isJoint: false,
	notes: null,
	createdAt: new Date("2026-08-01T10:00:00.000Z"),
	updatedAt: new Date("2026-08-01T10:00:00.000Z"),
};

describe("debts service", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.list.mockResolvedValue([debt]);
		mocks.count.mockResolvedValue(1);
	});

	it("returns a paginated list with normalised payments", async () => {
		const result = await debtsService.list({
			householdId: debt.householdId,
			query: { page: 1, pageSize: 20 },
		});

		expect(result.data[0]?.normalisedPayment).toEqual({
			weekly: "100.00",
			monthly: "433.33",
			yearly: "5200.00",
		});
		expect(result.pagination).toEqual({
			page: 1,
			pageSize: 20,
			totalItems: 1,
			totalPages: 1,
			hasPreviousPage: false,
			hasNextPage: false,
		});
		expect(mocks.list).toHaveBeenCalledWith(
			expect.objectContaining({ limit: 20, offset: 0 }),
		);
	});
});
