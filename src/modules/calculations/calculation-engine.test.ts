import { describe, expect, it } from "vitest";

import {
	calculateIncomeTax,
	calculateNationalInsurance,
	calculateStudentLoan,
} from "@/modules/calculators/calculators.service";
import { benefitSchemeKeys, validateBenefitRuleSets } from "@/rules/benefits";
import { runCalculation } from "./calculation-engine";

describe("versioned UK calculation engines", () => {
	it("has complete sourced benefit rules for every supported year", () => {
		expect(validateBenefitRuleSets()).toEqual([]);
	});

	it("returns confirmed totals separately from disability scenarios", () => {
		const result = runCalculation(
			{
				calculator: "benefits",
				taxYear: "2026-27",
				age: 35,
				partner: false,
				dependentChildren: 2,
				weeklyEarnings: "100.00",
				capital: "0.00",
				disabled: true,
				caring35Hours: true,
				statePensionAge: false,
				pregnantOrNewParent: false,
				bereaved: false,
				declaredSchemeKeys: [],
				useStoredFacts: true,
			},
			"england",
		);
		expect(result.items).toHaveLength(benefitSchemeKeys.length);
		expect(result.benefitAssessment?.confirmedWeeklyAmount).toBe("131.40");
		expect(result.benefitAssessment?.conditionalMaximumWeeklyAmount).toBe(
			"194.60",
		);
		expect(
			result.items.find((item) => item.key === "personal_independence_payment")
				?.status,
		).toBe("official_assessment_required");
	});

	it("uses stored awards and never adds conditional scenarios to the total", () => {
		const result = runCalculation(
			{
				calculator: "benefits",
				taxYear: "2025-26",
				age: 70,
				partner: false,
				dependentChildren: 0,
				weeklyEarnings: "0.00",
				capital: "0.00",
				disabled: true,
				caring35Hours: false,
				statePensionAge: true,
				pregnantOrNewParent: false,
				bereaved: false,
				declaredSchemeKeys: [],
				useStoredFacts: true,
			},
			"england",
			{
				existingAwards: [
					{
						schemeKey: "pension_credit",
						amount: "100.00",
						frequency: "weekly",
					},
				],
				statePensionQualifyingYears: 35,
			},
		);
		expect(result.weeklyAmount).toBe("330.25");
		expect(result.benefitAssessment?.conditionalMaximumWeeklyAmount).toBe(
			"110.40",
		);
	});
	it("calculates Income Tax and National Insurance with decimal strings", () => {
		const tax = calculateIncomeTax({
			taxYear: "2026-27",
			nation: "england",
			grossAnnualIncome: "50000.00",
			pensionGrossContributions: "0.00",
		});
		const ni = calculateNationalInsurance({
			taxYear: "2026-27",
			employmentType: "employee",
			annualEarnings: "50000.00",
		});
		expect(tax.annualTax).toBe("7486.00");
		expect(ni.annualContributions).toBe("2994.40");
	});

	it("uses the correct student-loan threshold and rate", () => {
		const result = calculateStudentLoan({
			taxYear: "2026-27",
			annualEarnings: "50000.00",
			plans: ["plan_2"],
		});
		expect(result.annualRepayment).toBe("1855.35");
	});

	it("applies CMS basic-plus and shared-care rules", () => {
		const result = runCalculation(
			{
				calculator: "child_maintenance",
				taxYear: "2026-27",
				grossWeeklyIncome: "1000.00",
				qualifyingChildren: 1,
				relevantOtherChildren: 0,
				sharedCareNights: 0,
				receivesQualifyingBenefits: false,
				collectionMethod: "direct_pay",
				perspective: "payer",
			},
			"england",
		);
		expect(result.weeklyAmount).toBe("114.00");
		expect(result.values.rateBand).toBe("basic_plus");
	});

	it("calculates the 2026 Universal Credit standard allowance", () => {
		const result = runCalculation(
			{
				calculator: "universal_credit",
				taxYear: "2026-27",
				couple: false,
				claimantAge25OrOver: true,
				children: [],
				monthlyHousingCosts: "0.00",
				monthlyChildcareCosts: "0.00",
				monthlyNetEarnings: "0.00",
				capital: "0.00",
				workAllowanceEligible: false,
				lcwra: false,
				pre2026LcwraProtection: false,
				carer: false,
				monthlyDeductions: "0.00",
			},
			"england",
		);
		expect(result.monthlyAmount).toBe("424.90");
	});

	it("reports conflicting childcare support", () => {
		const result = runCalculation(
			{
				calculator: "childcare",
				taxYear: "2026-27",
				nation: "england",
				childAgeMonths: 24,
				childDisabled: false,
				approvedProvider: true,
				bothParentsWorking: true,
				minimumEarningsMet: true,
				highestParentAdjustedNetIncome: "50000.00",
				monthlyChildcareCost: "1000.00",
				receivingUniversalCredit: true,
				usingTaxFreeChildcare: true,
			},
			"england",
		);
		expect(result.values.fundedHoursPerWeek).toBe(30);
		expect(result.values.conflictingSupport).toBe(true);
	});

	it("generates a deterministic avalanche repayment schedule", () => {
		const result = runCalculation(
			{
				calculator: "debt_repayment",
				taxYear: "2026-27",
				strategy: "avalanche",
				monthlyBudget: "200.00",
				startDate: "2026-08-01",
				debts: [
					{
						debtId: "074f1038-70b1-467e-b5c6-72d14c8fa659",
						balance: "1000.00",
						annualInterestRate: "12.0000",
						minimumPayment: "50.00",
					},
				],
			},
			"england",
		);
		expect(result.schedule.length).toBeGreaterThan(0);
		expect(result.values.fullyRepaid).toBe(true);
	});
});
