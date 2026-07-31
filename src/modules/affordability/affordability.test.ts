import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRouter } from "@/lib/create-app";

import affordabilityRouter from "./affordability.index";
import { affordabilityService } from "./affordability.service";

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

vi.mock("./affordability.service", () => ({
	affordabilityService: {
		calculate: vi.fn(),
	},
}));

const mockedCalculate = vi.mocked(affordabilityService.calculate);

const householdId = "074f1038-70b1-467e-b5c6-72d14c8fa659";

const affordabilityAssessment = {
	householdId,
	rating: "manageable" as const,
	isAffordable: true,
	totals: {
		netMonthlyIncome: "2500.00",
		benefitIncome: "0.00",
		otherIncome: "0.00",
		totalMonthlyIncome: "2500.00",
		essentialExpenses: "1000.00",
		importantExpenses: "250.00",
		discretionaryExpenses: "150.00",
		debtPayments: "200.00",
		housingCosts: "800.00",
		totalMonthlyExpenses: "1600.00",
		currentDisposableIncome: "900.00",
		projectedDisposableIncome: "650.00",
		requiredMonthlyBuffer: "100.00",
		availableAfterBuffer: "550.00",
		proposedMonthlyCommitment: "250.00",
	},
	ratios: {
		housingCostPercentage: "32.00",
		debtToIncomePercentage: "18.00",
		essentialCostPercentage: "40.00",
		totalExpensePercentage: "74.00",
		disposableIncomePercentage: "26.00",
	},
	reasons: [
		"The household remains within the configured affordability limits.",
	],
	calculatedAt: "2026-07-30T18:00:00.000Z",
};

function createTestApp() {
	const app = createRouter();

	app.route("/v1/households/:householdId/affordability", affordabilityRouter);

	return app;
}

describe("affordability routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		mockedCalculate.mockResolvedValue(affordabilityAssessment);
	});

	it("calculates affordability for a household", async () => {
		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/affordability/calculate`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					proposedMonthlyCommitment: "250.00",
					requiredMonthlyBuffer: "100.00",
					maximumDebtToIncomePercentage: "40.00",
				}),
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(affordabilityAssessment);

		expect(mockedCalculate).toHaveBeenCalledWith({
			householdId,
			values: {
				proposedMonthlyCommitment: "250.00",
				requiredMonthlyBuffer: "100.00",
				maximumDebtToIncomePercentage: "40.00",
			},
		});
	});

	it("rejects an invalid proposed monthly commitment", async () => {
		const app = createTestApp();

		const response = await app.request(
			`/v1/households/${householdId}/affordability/calculate`,
			{
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					proposedMonthlyCommitment: "-1.00",
				}),
			},
		);

		expect(response.status).toBe(422);
		expect(mockedCalculate).not.toHaveBeenCalled();
	});
});
