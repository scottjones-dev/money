import Decimal from "decimal.js";

import {
	getIncomeTaxRules,
	getNationalInsuranceRules,
	type IncomeTaxBand,
	type NationalInsuranceBand,
} from "@/rules/registry";
import type {
	IncomeTaxRequest,
	NationalInsuranceRequest,
	PensionReliefRequest,
	StudentLoanRequest,
	TakeHomeRequest,
} from "./calculators.schemas";

const TAX_SOURCE = "https://www.gov.uk/income-tax-rates/previous-tax-years";
const SCOTTISH_TAX_SOURCE =
	"https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/";
const NI_SOURCE =
	"https://www.gov.uk/government/publications/rates-and-allowances-national-insurance-contributions/rates-and-allowances-national-insurance-contributions";
const STUDENT_SOURCE =
	"https://www.gov.uk/guidance/previous-annual-repayment-thresholds";
const PENSION_SOURCE =
	"https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief";

const thresholds: Record<string, Record<string, string | null>> = {
	"2022-23": {
		plan_1: "20195",
		plan_2: "27295",
		plan_4: "25375",
		plan_5: null,
		postgraduate: "21000",
	},
	"2023-24": {
		plan_1: "22015",
		plan_2: "27295",
		plan_4: "27660",
		plan_5: null,
		postgraduate: "21000",
	},
	"2024-25": {
		plan_1: "24990",
		plan_2: "27295",
		plan_4: "31395",
		plan_5: null,
		postgraduate: "21000",
	},
	"2025-26": {
		plan_1: "26065",
		plan_2: "28470",
		plan_4: "32745",
		plan_5: null,
		postgraduate: "21000",
	},
	"2026-27": {
		plan_1: "26900",
		plan_2: "29385",
		plan_4: "33795",
		plan_5: "25000",
		postgraduate: "21000",
	},
};

const money = (value: Decimal.Value) =>
	new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
type SupportedTaxYear = IncomeTaxRequest["taxYear"];
type WarningCode =
	| "ANNUALISED_ESTIMATE"
	| "OFFICIAL_ASSESSMENT_REQUIRED"
	| "MISSING_FACT"
	| "INELIGIBLE"
	| "CONFLICTING_SUPPORT"
	| "RULE_UNAVAILABLE"
	| "COURT_CALCULATION_REQUIRED"
	| "NOT_FINANCIAL_ADVICE";
const metadata = (
	type: string,
	taxYear: SupportedTaxYear,
	sources: string[],
	warnings: Array<{
		code: WarningCode;
		message: string;
		severity: "info" | "warning";
	}> = [],
) => ({
	ruleSetKey: `${type}-${taxYear}-v1`,
	taxYear,
	calculatedAt: new Date().toISOString(),
	sources,
	warnings,
});

function applyBands(
	value: Decimal,
	bands: readonly (IncomeTaxBand | NationalInsuranceBand)[],
) {
	let total = new Decimal(0);
	const steps: Array<{
		label: string;
		amount: string;
		rate: string | null;
		result: string;
	}> = [];
	for (const band of bands) {
		const from = new Decimal(band.from);
		const to = band.to === null ? value : Decimal.min(value, band.to);
		const amount = Decimal.max(0, to.minus(from));
		if (amount.isZero()) continue;
		const result = amount.times(band.rate).div(100);
		total = total.plus(result);
		steps.push({
			label: band.name,
			amount: money(amount),
			rate: new Decimal(band.rate).toFixed(4),
			result: money(result),
		});
	}
	return { total, steps };
}

export function calculateIncomeTax(input: IncomeTaxRequest) {
	const gross = new Decimal(input.grossAnnualIncome);
	const pension = new Decimal(input.pensionGrossContributions);
	const adjusted = Decimal.max(0, gross.minus(pension));
	const rules = getIncomeTaxRules({
		taxYear: input.taxYear,
		jurisdiction: input.nation,
	});
	const taper = Decimal.max(
		0,
		adjusted.minus(rules.personalAllowanceTaperThreshold),
	)
		.times(rules.personalAllowanceTaperRate)
		.div(100);
	const allowance = Decimal.max(
		0,
		new Decimal(rules.personalAllowance).minus(taper),
	);
	const taxable = Decimal.max(0, adjusted.minus(allowance));
	const { total, steps } = applyBands(taxable, rules.bands);
	return {
		type: "income_tax" as const,
		metadata: metadata(
			"income-tax",
			input.taxYear,
			input.nation === "scotland"
				? [TAX_SOURCE, SCOTTISH_TAX_SOURCE]
				: [TAX_SOURCE],
		),
		grossAnnualIncome: money(gross),
		adjustedNetIncome: money(adjusted),
		personalAllowance: money(allowance),
		taxableIncome: money(taxable),
		annualTax: money(total),
		monthlyTax: money(total.div(12)),
		steps,
	};
}

export function calculateNationalInsurance(input: NationalInsuranceRequest) {
	const earnings = new Decimal(input.annualEarnings);
	const rules = getNationalInsuranceRules(input.taxYear);
	const bands =
		input.employmentType === "employee"
			? rules.employeeClass1.bands
			: (rules.selfEmployedClass4?.bands ?? []);
	const { total, steps } = applyBands(earnings, bands);
	const warnings = ["2022-23", "2023-24"].includes(input.taxYear)
		? [
				{
					code: "ANNUALISED_ESTIMATE" as const,
					message:
						"This tax year had in-year Class 1 rate changes; the result is an annualised estimate and can differ from pay-period payroll deductions.",
					severity: "warning" as const,
				},
			]
		: [
				{
					code: "ANNUALISED_ESTIMATE" as const,
					message:
						"Actual employee National Insurance is calculated for each pay period.",
					severity: "info" as const,
				},
			];
	return {
		type: "national_insurance" as const,
		metadata: metadata(
			"national-insurance",
			input.taxYear,
			[NI_SOURCE],
			warnings,
		),
		employmentType: input.employmentType,
		annualEarnings: money(earnings),
		annualContributions: money(total),
		monthlyContributions: money(total.div(12)),
		steps,
	};
}

export function calculateStudentLoan(input: StudentLoanRequest) {
	const earnings = new Decimal(input.annualEarnings);
	const year = thresholds[input.taxYear] ?? {};
	const undergraduate = input.plans
		.filter((plan) => plan !== "postgraduate")
		.map((plan) => ({ plan, threshold: year[plan] }))
		.filter(
			(entry) => entry.threshold !== null && entry.threshold !== undefined,
		) as Array<{
		plan: Exclude<StudentLoanRequest["plans"][number], "postgraduate">;
		threshold: string;
	}>;
	const lowest = undergraduate.sort((a, b) =>
		new Decimal(a.threshold).cmp(b.threshold),
	)[0];
	const steps: Array<{
		label: string;
		amount: string;
		rate: string | null;
		result: string;
	}> = [];
	let total = new Decimal(0);
	if (lowest) {
		const amount = Decimal.max(0, earnings.minus(lowest.threshold));
		const result = amount.times(9).div(100);
		total = total.plus(result);
		steps.push({
			label: lowest.plan,
			amount: money(amount),
			rate: "9.0000",
			result: money(result),
		});
	}
	if (input.plans.includes("postgraduate")) {
		const amount = Decimal.max(0, earnings.minus(year.postgraduate ?? "21000"));
		const result = amount.times(6).div(100);
		total = total.plus(result);
		steps.push({
			label: "postgraduate",
			amount: money(amount),
			rate: "6.0000",
			result: money(result),
		});
	}
	const unavailable = input.plans.filter((plan) => year[plan] === null);
	const warnings = unavailable.map((plan) => ({
		code: "RULE_UNAVAILABLE" as const,
		message: `${plan} was not in repayment in ${input.taxYear}.`,
		severity: "warning" as const,
	}));
	return {
		type: "student_loan" as const,
		metadata: metadata(
			"student-loan",
			input.taxYear,
			[STUDENT_SOURCE],
			warnings,
		),
		annualEarnings: money(earnings),
		annualRepayment: money(total),
		monthlyRepayment: money(total.div(12)),
		steps,
	};
}

export function calculatePensionRelief(input: PensionReliefRequest) {
	const contribution = new Decimal(input.contribution);
	const gross =
		input.contributionBasis === "relief_at_source_net"
			? contribution.div("0.8")
			: contribution;
	const personalCost =
		input.contributionBasis === "relief_at_source_net" ? contribution : gross;
	const providerRelief = gross.minus(contribution);
	const without = calculateIncomeTax({
		taxYear: input.taxYear,
		nation: input.nation,
		grossAnnualIncome: input.grossAnnualIncome,
		pensionGrossContributions: "0.00",
	});
	const withContribution = calculateIncomeTax({
		taxYear: input.taxYear,
		nation: input.nation,
		grossAnnualIncome: input.grossAnnualIncome,
		pensionGrossContributions: money(gross),
	});
	const totalTaxEffect = Decimal.max(
		0,
		new Decimal(without.annualTax).minus(withContribution.annualTax),
	);
	const additional = Decimal.max(0, totalTaxEffect.minus(providerRelief));
	return {
		type: "pension_relief" as const,
		metadata: metadata(
			"pension-relief",
			input.taxYear,
			[PENSION_SOURCE, ...without.metadata.sources],
			[
				{
					code: "NOT_FINANCIAL_ADVICE",
					message: "This estimate is not personalised pension or tax advice.",
					severity: "warning",
				},
			],
		),
		grossContribution: money(gross),
		personalCost: money(personalCost),
		providerRelief: money(providerRelief),
		estimatedAdditionalRelief: money(additional),
		steps: [
			{
				label: "gross contribution",
				amount: money(gross),
				rate: null,
				result: money(gross),
			},
			{
				label: "estimated total tax effect",
				amount: money(gross),
				rate: null,
				result: money(totalTaxEffect),
			},
		],
	};
}

export function calculateTakeHome(input: TakeHomeRequest) {
	const tax = calculateIncomeTax(input);
	const ni = calculateNationalInsurance({
		taxYear: input.taxYear,
		employmentType: input.employmentType,
		annualEarnings: input.grossAnnualIncome,
	});
	const loan = input.studentLoanPlans.length
		? calculateStudentLoan({
				taxYear: input.taxYear,
				annualEarnings: input.grossAnnualIncome,
				plans: input.studentLoanPlans,
			})
		: null;
	const net = new Decimal(input.grossAnnualIncome)
		.minus(tax.annualTax)
		.minus(ni.annualContributions)
		.minus(loan?.annualRepayment ?? 0)
		.minus(input.pensionGrossContributions);
	return {
		type: "take_home_pay" as const,
		metadata: metadata(
			"take-home-pay",
			input.taxYear,
			[
				...new Set([
					...tax.metadata.sources,
					...ni.metadata.sources,
					...(loan?.metadata.sources ?? []),
				]),
			],
			[...ni.metadata.warnings, ...(loan?.metadata.warnings ?? [])],
		),
		grossAnnualIncome: money(input.grossAnnualIncome),
		incomeTax: tax.annualTax,
		nationalInsurance: ni.annualContributions,
		studentLoan: loan?.annualRepayment ?? "0.00",
		pensionContributions: money(input.pensionGrossContributions),
		netAnnualIncome: money(Decimal.max(0, net)),
		netMonthlyIncome: money(Decimal.max(0, net).div(12)),
		netWeeklyIncome: money(Decimal.max(0, net).div(52)),
		steps: [
			{
				label: "income tax",
				amount: tax.taxableIncome,
				rate: null,
				result: tax.annualTax,
			},
			{
				label: "National Insurance",
				amount: ni.annualEarnings,
				rate: null,
				result: ni.annualContributions,
			},
			{
				label: "student loan",
				amount: money(input.grossAnnualIncome),
				rate: null,
				result: loan?.annualRepayment ?? "0.00",
			},
		],
	};
}
