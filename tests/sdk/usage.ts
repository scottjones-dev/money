import { createAuthClient } from "better-auth/client";
import {
	calculateAffordability,
	calculateIncomeTax,
	commitHouseholdCalculation,
	createAsset,
	createDebt,
	createDebtPayment,
	createHousehold,
	type ErrorCode,
	type ErrorResponse,
	listHouseholdCalculations,
	listHouseholds,
	previewHouseholdCalculation,
} from "../../.tmp/sdk";
import { client } from "../../.tmp/sdk/client.gen";

client.setConfig({
	baseUrl: "http://localhost:9000",
	credentials: "include",
});

const authClient = createAuthClient({ baseURL: "http://localhost:9000" });

async function exerciseSdk(): Promise<void> {
	await authClient.signIn.email({
		email: "alex@example.com",
		password: "correct-horse-battery",
	});
	await authClient.getSession();

	await calculateIncomeTax({
		body: {
			taxYear: "2026-27",
			nation: "england",
			grossAnnualIncome: "42000.00",
			pensionGrossContributions: "0.00",
		},
	});

	const households = await listHouseholds({
		query: { page: 1, pageSize: 25 },
	});
	if (households.data) {
		const firstName: string | undefined = households.data.data[0]?.name;
		void firstName;
	}

	await createHousehold({
		body: { name: "Jones Household", postcodeArea: "SP4", nation: "england" },
	});
	await createAsset({
		path: { householdId: "074f1038-70b1-467e-b5c6-72d14c8fa659" },
		body: {
			type: "savings_account",
			name: "Emergency fund",
			currentValue: "5000.00",
			ownershipType: "household",
			isLiquid: true,
			includeInNetWorth: true,
			isActive: true,
		},
	});
	await createDebtPayment({
		path: {
			householdId: "074f1038-70b1-467e-b5c6-72d14c8fa659",
			debtId: "174f1038-70b1-467e-b5c6-72d14c8fa659",
		},
		body: {
			amount: "40.00",
			paymentDate: "2026-08-01",
			type: "minimum",
			status: "completed",
			idempotencyKey: "payment-2026-08-card",
		},
	});
	const preview = await previewHouseholdCalculation({
		path: {
			householdId: "074f1038-70b1-467e-b5c6-72d14c8fa659",
			calculator: "universal_credit",
		},
		body: {
			calculator: "universal_credit",
			taxYear: "2026-27",
			couple: false,
			claimantAge25OrOver: true,
			children: [],
			monthlyHousingCosts: "700.00",
			monthlyChildcareCosts: "0.00",
			monthlyNetEarnings: "1200.00",
			capital: "5000.00",
			workAllowanceEligible: false,
			lcwra: false,
			pre2026LcwraProtection: false,
			carer: false,
			monthlyDeductions: "0.00",
		},
	});
	if (preview.data)
		await commitHouseholdCalculation({
			path: {
				householdId: preview.data.householdId,
				calculationId: preview.data.id,
			},
		});
	const benefits = await previewHouseholdCalculation({
		path: {
			householdId: "074f1038-70b1-467e-b5c6-72d14c8fa659",
			calculator: "benefits",
		},
		body: {
			calculator: "benefits",
			taxYear: "2026-27",
			memberId: "274f1038-70b1-467e-b5c6-72d14c8fa659",
			useStoredFacts: true,
			age: 36,
			partner: false,
			dependentChildren: 1,
			weeklyEarnings: "150.00",
			capital: "2000.00",
			disabled: true,
			caring35Hours: false,
			statePensionAge: false,
			pregnantOrNewParent: false,
			bereaved: false,
			declaredSchemeKeys: [],
			facts: {
				ordinarilyResident: true,
				hasRecourseToPublicFunds: true,
				children: [{ age: 4 }],
			},
		},
	});
	const confirmedBenefits: string | undefined =
		benefits.data?.output?.benefitAssessment?.confirmedMonthlyAmount;
	void confirmedBenefits;
	await listHouseholdCalculations({
		path: { householdId: "074f1038-70b1-467e-b5c6-72d14c8fa659" },
		query: { page: 1, pageSize: 25, calculator: "benefits" },
	});
	await createDebt({
		path: { householdId: "074f1038-70b1-467e-b5c6-72d14c8fa659" },
		body: {
			type: "credit_card",
			name: "Main credit card",
			currentBalance: "1250.50",
			minimumPayment: "40.00",
			paymentFrequency: "monthly",
		},
	});
	await calculateAffordability({
		path: { householdId: "074f1038-70b1-467e-b5c6-72d14c8fa659" },
		body: { proposedMonthlyCommitment: "250.00" },
	});

	const result = await listHouseholds();
	if (result.error) {
		const error: ErrorResponse = result.error;
		const code: ErrorCode = error.error.code;
		void code;
	}
}

void exerciseSdk;
