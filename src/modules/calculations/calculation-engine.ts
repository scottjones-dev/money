import Decimal from "decimal.js";
import {
	calculateIncomeTax,
	calculateNationalInsurance,
	calculateStudentLoan,
	calculateTakeHome,
} from "@/modules/calculators/calculators.service";
import {
	calculateBenefitsAssessment,
	type StoredBenefitFacts,
} from "./benefits-engine";
import type {
	CalculationInput,
	CalculationOutput,
} from "./calculations.schemas";

const money = (v: Decimal.Value) =>
	new Decimal(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
const GOV_BENEFIT_RATES =
	"https://www.gov.uk/government/publications/benefit-and-pension-rates-2026-to-2027";
const GOV_CMS =
	"https://www.gov.uk/how-child-maintenance-is-worked-out/how-worked-out";
const GOV_CHILDCARE =
	"https://www.gov.uk/cost-of-living/childcare-and-maternity-costs";
const result = (
	type: CalculationOutput["type"],
	amounts: {
		annual?: Decimal.Value | null;
		monthly?: Decimal.Value | null;
		weekly?: Decimal.Value | null;
	},
	values: CalculationOutput["values"],
	sources: string[],
	extra: Partial<CalculationOutput> = {},
): CalculationOutput => ({
	type,
	annualAmount: amounts.annual == null ? null : money(amounts.annual),
	monthlyAmount: amounts.monthly == null ? null : money(amounts.monthly),
	weeklyAmount: amounts.weekly == null ? null : money(amounts.weekly),
	values,
	items: [],
	schedule: [],
	assumptions: [],
	sources,
	...extra,
});
const rates: Record<
	string,
	{
		singleU25: string;
		single25: string;
		coupleU25: string;
		couple25: string;
		childFirst: string;
		childOther: string;
		disabledLow: string;
		disabledHigh: string;
		lcwra: string;
		lcwraProtected: string;
		carer: string;
		workNoHousing: string;
		workHousing: string;
		childcare1: string;
		childcare2: string;
	}
> = {
	"2022-23": {
		singleU25: "265.31",
		single25: "334.91",
		coupleU25: "416.45",
		couple25: "525.72",
		childFirst: "290.00",
		childOther: "244.58",
		disabledLow: "132.89",
		disabledHigh: "414.88",
		lcwra: "354.28",
		lcwraProtected: "354.28",
		carer: "168.81",
		workNoHousing: "573",
		workHousing: "344",
		childcare1: "646.35",
		childcare2: "1108.04",
	},
	"2023-24": {
		singleU25: "292.11",
		single25: "368.74",
		coupleU25: "458.51",
		couple25: "578.82",
		childFirst: "315.00",
		childOther: "269.58",
		disabledLow: "146.31",
		disabledHigh: "456.89",
		lcwra: "390.06",
		lcwraProtected: "390.06",
		carer: "185.86",
		workNoHousing: "631",
		workHousing: "379",
		childcare1: "950.92",
		childcare2: "1630.15",
	},
	"2024-25": {
		singleU25: "311.68",
		single25: "393.45",
		coupleU25: "489.23",
		couple25: "617.60",
		childFirst: "333.33",
		childOther: "287.92",
		disabledLow: "156.11",
		disabledHigh: "487.58",
		lcwra: "416.19",
		lcwraProtected: "416.19",
		carer: "198.31",
		workNoHousing: "673",
		workHousing: "404",
		childcare1: "1014.63",
		childcare2: "1739.37",
	},
	"2025-26": {
		singleU25: "316.98",
		single25: "400.14",
		coupleU25: "497.55",
		couple25: "628.10",
		childFirst: "339.00",
		childOther: "292.81",
		disabledLow: "158.76",
		disabledHigh: "495.87",
		lcwra: "423.27",
		lcwraProtected: "423.27",
		carer: "201.68",
		workNoHousing: "684",
		workHousing: "411",
		childcare1: "1031.88",
		childcare2: "1768.94",
	},
	"2026-27": {
		singleU25: "338.58",
		single25: "424.90",
		coupleU25: "528.34",
		couple25: "666.97",
		childFirst: "351.88",
		childOther: "303.94",
		disabledLow: "164.79",
		disabledHigh: "514.71",
		lcwra: "217.26",
		lcwraProtected: "429.80",
		carer: "209.34",
		workNoHousing: "710",
		workHousing: "427",
		childcare1: "1071.09",
		childcare2: "1836.16",
	},
};
function universalCredit(
	input: Extract<CalculationInput, { calculator: "universal_credit" }>,
) {
	const r = rates[input.taxYear];
	if (!r)
		throw new Error(`Missing Universal Credit rules for ${input.taxYear}.`);
	let maximum = new Decimal(
		input.couple
			? input.claimantAge25OrOver
				? r.couple25
				: r.coupleU25
			: input.claimantAge25OrOver
				? r.single25
				: r.singleU25,
	);
	const allowedChildren =
		input.taxYear === "2026-27" ? input.children : input.children.slice(0, 2);
	allowedChildren.forEach((child, index) => {
		maximum = maximum.plus(
			index === 0 && child.bornBeforeApril2017 ? r.childFirst : r.childOther,
		);
		if (child.disability === "lower") maximum = maximum.plus(r.disabledLow);
		if (child.disability === "higher") maximum = maximum.plus(r.disabledHigh);
	});
	maximum = maximum.plus(input.monthlyHousingCosts);
	const childcareCap = input.children.length > 1 ? r.childcare2 : r.childcare1;
	const childcare = Decimal.min(
		new Decimal(input.monthlyChildcareCosts).times("0.85"),
		childcareCap,
	);
	maximum = maximum.plus(childcare);
	if (input.lcwra)
		maximum = maximum.plus(
			input.pre2026LcwraProtection ? r.lcwraProtected : r.lcwra,
		);
	if (input.carer) maximum = maximum.plus(r.carer);
	if (new Decimal(input.capital).gte(16000)) maximum = new Decimal(0);
	const workAllowance = input.workAllowanceEligible
		? new Decimal(
				new Decimal(input.monthlyHousingCosts).gt(0)
					? r.workHousing
					: r.workNoHousing,
			)
		: new Decimal(0);
	const earningsDeduction = Decimal.max(
		0,
		new Decimal(input.monthlyNetEarnings).minus(workAllowance),
	).times("0.55");
	const tariff = new Decimal(input.capital).gt(6000)
		? new Decimal(input.capital).minus(6000).div(250).ceil().times("4.35")
		: new Decimal(0);
	const award = Decimal.max(
		0,
		maximum
			.minus(earningsDeduction)
			.minus(tariff)
			.minus(input.monthlyDeductions),
	);
	return result(
		"universal_credit",
		{
			monthly: award,
			annual: award.times(12),
			weekly: award.times(12).div(52),
		},
		{
			maximumAmount: money(maximum),
			earningsDeduction: money(earningsDeduction),
			capitalTariffIncome: money(tariff),
			childcareElement: money(childcare),
			workAllowance: money(workAllowance),
		},
		[GOV_BENEFIT_RATES, "https://www.gov.uk/universal-credit/what-youll-get"],
		{
			assumptions:
				input.children.length > allowedChildren.length
					? [
							"The pre-April-2026 two-child limit was applied because no exception facts were supplied.",
						]
					: [],
		},
	);
}
function childMaintenance(
	input: Extract<CalculationInput, { calculator: "child_maintenance" }>,
) {
	const countIndex = Math.min(input.qualifyingChildren, 3) - 1;
	const income = new Decimal(input.grossWeeklyIncome);
	const otherReduction =
		[0, 11, 14, 16][Math.min(input.relevantOtherChildren, 3)] ?? 16;
	const adjusted = income.times(
		new Decimal(100).minus(otherReduction).div(100),
	);
	let weekly = new Decimal(0);
	let band = "nil";
	if (
		input.receivesQualifyingBenefits ||
		(adjusted.gte(7) && adjusted.lte(100))
	) {
		weekly = new Decimal(7);
		band = "flat";
	} else if (adjusted.gt(100) && adjusted.lt(200)) {
		weekly = new Decimal(7).plus(
			adjusted
				.minus(100)
				.times([17, 25, 31][countIndex] ?? 31)
				.div(100),
		);
		band = "reduced";
	} else if (adjusted.gte(200)) {
		const first = Decimal.min(adjusted, 800)
			.times([12, 16, 19][countIndex] ?? 19)
			.div(100);
		const rest = Decimal.max(0, Decimal.min(adjusted, 3000).minus(800))
			.times([9, 12, 15][countIndex] ?? 15)
			.div(100);
		weekly = first.plus(rest);
		band = adjusted.gt(800) ? "basic_plus" : "basic";
	}
	if (input.sharedCareNights >= 175)
		weekly = Decimal.max(7, weekly.times("0.5").minus(7));
	else if (input.sharedCareNights >= 156)
		weekly = Decimal.max(7, weekly.times(new Decimal(4).div(7)));
	else if (input.sharedCareNights >= 104)
		weekly = Decimal.max(7, weekly.times(new Decimal(5).div(7)));
	else if (input.sharedCareNights >= 52)
		weekly = Decimal.max(7, weekly.times(new Decimal(6).div(7)));
	if (adjusted.lt(7)) weekly = new Decimal(0);
	const payer =
		input.collectionMethod === "collect_and_pay" ? weekly.times("1.2") : weekly;
	const receiver =
		input.collectionMethod === "collect_and_pay"
			? weekly.times("0.96")
			: weekly;
	return result(
		"child_maintenance",
		{
			weekly: input.perspective === "payer" ? payer : receiver,
			monthly: (input.perspective === "payer" ? payer : receiver)
				.times(52)
				.div(12),
			annual: (input.perspective === "payer" ? payer : receiver).times(52),
		},
		{
			rateBand: band,
			adjustedWeeklyIncome: money(adjusted),
			baseWeeklyMaintenance: money(weekly),
			payerWeeklyAmount: money(payer),
			receiverWeeklyAmount: money(receiver),
			courtCalculationMayApply: adjusted.gt(3000),
		},
		[GOV_CMS],
	);
}
function childcare(
	input: Extract<CalculationInput, { calculator: "childcare" }>,
	nation: string,
) {
	const ageYears = input.childAgeMonths / 12;
	let hours = 0;
	if (nation === "england") hours = ageYears >= 3 && ageYears < 5 ? 15 : 0;
	if (
		nation === "england" &&
		input.bothParentsWorking &&
		input.minimumEarningsMet &&
		Number(input.highestParentAdjustedNetIncome) <= 100000 &&
		ageYears >= 0.75 &&
		ageYears < 5
	)
		hours = 30;
	if (nation === "scotland" && ageYears >= 3 && ageYears < 5) hours = 30;
	if (nation === "wales" && ageYears >= 3 && ageYears < 5)
		hours = input.bothParentsWorking ? 30 : 10;
	if (nation === "northern_ireland" && ageYears >= 3 && ageYears < 5)
		hours = 12.5;
	const cost = new Decimal(input.monthlyChildcareCost);
	const tfcEligible =
		input.approvedProvider &&
		input.minimumEarningsMet &&
		Number(input.highestParentAdjustedNetIncome) <= 100000 &&
		!input.receivingUniversalCredit;
	const tfc = tfcEligible
		? Decimal.min(
				cost.times("0.2"),
				input.childDisabled
					? new Decimal(4000).div(12)
					: new Decimal(2000).div(12),
			)
		: new Decimal(0);
	const uc = input.receivingUniversalCredit
		? cost.times("0.85")
		: new Decimal(0);
	return result(
		"childcare",
		{
			monthly: Decimal.max(tfc, uc),
			annual: Decimal.max(tfc, uc).times(12),
			weekly: null,
		},
		{
			nation,
			fundedHoursPerWeek: hours,
			taxFreeChildcareEligible: tfcEligible,
			estimatedTaxFreeChildcareTopUp: money(tfc),
			estimatedUniversalCreditChildcare: money(uc),
			conflictingSupport:
				input.receivingUniversalCredit && input.usingTaxFreeChildcare,
		},
		[
			GOV_CHILDCARE,
			"https://www.gov.uk/tax-free-childcare",
			"https://www.gov.uk/guidance/universal-credit-childcare-costs",
		],
	);
}
function pension(input: Extract<CalculationInput, { calculator: "pension" }>) {
	const months = Math.max(0, (input.retirementAge - input.currentAge) * 12);
	const monthlyRate = new Decimal(input.annualGrowthRate)
		.minus(input.annualChargeRate)
		.div(100)
		.div(12);
	let pot = new Decimal(input.currentPot);
	const contribution = new Decimal(input.monthlyPersonalContribution).plus(
		input.monthlyEmployerContribution,
	);
	for (let m = 0; m < months; m += 1)
		pot = pot.times(monthlyRate.plus(1)).plus(contribution);
	const income = pot.times(input.withdrawalRate).div(100);
	return result(
		"pension",
		{ annual: income, monthly: income.div(12), weekly: income.div(52) },
		{
			projectedPot: money(pot),
			yearsToRetirement: input.retirementAge - input.currentAge,
			totalMonthlyContribution: money(contribution),
			realTerms: false,
		},
		[
			"https://www.moneyhelper.org.uk/en/pensions-and-retirement/pension-wise/pension-calculator",
		],
		{
			assumptions: [
				"Growth and charges are applied monthly at constant rates.",
				"Inflation is not deducted unless the caller supplies a real growth assumption.",
				"This is a scenario, not regulated retirement advice.",
			],
		},
	);
}
function debtPlan(
	input: Extract<CalculationInput, { calculator: "debt_repayment" }>,
) {
	const debts = input.debts.map((d) => ({
		...d,
		balanceValue: new Decimal(d.balance),
	}));
	const schedule: CalculationOutput["schedule"] = [];
	let month = input.startDate.slice(0, 7);
	let interestTotal = new Decimal(0);
	for (
		let iteration = 0;
		iteration < 600 && debts.some((d) => d.balanceValue.gt(0));
		iteration += 1
	) {
		const date = new Date(`${month}-01T00:00:00Z`);
		const active = debts.filter((d) => d.balanceValue.gt(0));
		const minimumTotal = active.reduce(
			(sum, d) => sum.plus(Decimal.min(d.balanceValue, d.minimumPayment)),
			new Decimal(0),
		);
		let extra = Decimal.max(
			0,
			new Decimal(input.monthlyBudget).minus(minimumTotal),
		);
		const ordered = [...active].sort((a, b) =>
			input.strategy === "snowball"
				? a.balanceValue.cmp(b.balanceValue)
				: input.strategy === "avalanche"
					? new Decimal(b.annualInterestRate).cmp(a.annualInterestRate)
					: 0,
		);
		for (const d of ordered) {
			const opening = d.balanceValue;
			const interest = opening.times(d.annualInterestRate).div(1200);
			interestTotal = interestTotal.plus(interest);
			d.balanceValue = d.balanceValue.plus(interest);
			let payment = Decimal.min(d.balanceValue, d.minimumPayment);
			if (input.strategy === "custom" && d.customPayment)
				payment = Decimal.min(d.balanceValue, d.customPayment);
			else if (extra.gt(0) && d === ordered[0]) {
				const add = Decimal.min(extra, d.balanceValue.minus(payment));
				payment = payment.plus(add);
				extra = extra.minus(add);
			}
			d.balanceValue = Decimal.max(0, d.balanceValue.minus(payment));
			schedule.push({
				month,
				debtId: d.debtId,
				openingBalance: money(opening),
				payment: money(payment),
				interest: money(interest),
				closingBalance: money(d.balanceValue),
			});
		}
		date.setUTCMonth(date.getUTCMonth() + 1);
		month = date.toISOString().slice(0, 7);
	}
	const finalMonth = schedule.at(-1)?.month ?? input.startDate.slice(0, 7);
	return result(
		"debt_repayment",
		{ annual: null, monthly: input.monthlyBudget, weekly: null },
		{
			strategy: input.strategy,
			projectedDebtFreeMonth: finalMonth,
			totalInterest: money(interestTotal),
			fullyRepaid: debts.every((d) => d.balanceValue.eq(0)),
		},
		[
			"https://www.moneyhelper.org.uk/en/money-troubles/dealing-with-debt/debt-advice-locator",
		],
		{
			schedule,
			assumptions: [
				"Interest rates and monthly payment budget remain constant.",
				"No new borrowing, fees, missed payments, or payment execution is included.",
			],
		},
	);
}
export function runCalculation(
	input: CalculationInput,
	householdNation: string,
	storedBenefitFacts: StoredBenefitFacts = {},
): CalculationOutput {
	switch (input.calculator) {
		case "income_tax": {
			const v = calculateIncomeTax({
				...input,
				nation: householdNation as
					| "england"
					| "scotland"
					| "wales"
					| "northern_ireland",
			});
			return result(
				"income_tax",
				{
					annual: v.annualTax,
					monthly: v.monthlyTax,
					weekly: new Decimal(v.annualTax).div(52),
				},
				{
					taxableIncome: v.taxableIncome,
					personalAllowance: v.personalAllowance,
				},
				v.metadata.sources,
			);
		}
		case "national_insurance": {
			const v = calculateNationalInsurance(input);
			return result(
				"national_insurance",
				{
					annual: v.annualContributions,
					monthly: v.monthlyContributions,
					weekly: new Decimal(v.annualContributions).div(52),
				},
				{ employmentType: v.employmentType },
				v.metadata.sources,
			);
		}
		case "student_loan": {
			const v = calculateStudentLoan(input);
			return result(
				"student_loan",
				{
					annual: v.annualRepayment,
					monthly: v.monthlyRepayment,
					weekly: new Decimal(v.annualRepayment).div(52),
				},
				{ plans: input.plans.join(",") },
				v.metadata.sources,
			);
		}
		case "payroll": {
			const v = calculateTakeHome({
				...input,
				nation: householdNation as
					| "england"
					| "scotland"
					| "wales"
					| "northern_ireland",
			});
			return result(
				"payroll",
				{
					annual: v.netAnnualIncome,
					monthly: v.netMonthlyIncome,
					weekly: v.netWeeklyIncome,
				},
				{
					incomeTax: v.incomeTax,
					nationalInsurance: v.nationalInsurance,
					studentLoan: v.studentLoan,
					pensionContributions: v.pensionContributions,
				},
				v.metadata.sources,
			);
		}
		case "child_maintenance":
			return childMaintenance(input);
		case "childcare":
			return childcare(input, input.nation ?? householdNation);
		case "universal_credit":
			return universalCredit(input);
		case "benefits":
			return calculateBenefitsAssessment(
				input,
				input.nation ?? householdNation,
				storedBenefitFacts,
			);
		case "pension":
			return pension(input);
		case "debt_repayment":
			return debtPlan(input);
		case "affordability": {
			const disposable = new Decimal(input.monthlyNetIncome)
				.minus(input.monthlyExpenses)
				.minus(input.monthlyDebtPayments);
			const after = disposable.minus(input.proposedMonthlyCommitment);
			const affordable = after.gte(input.requiredMonthlyBuffer);
			return result(
				"affordability",
				{
					monthly: disposable,
					annual: disposable.times(12),
					weekly: disposable.times(12).div(52),
				},
				{
					disposableIncome: money(disposable),
					afterProposedCommitment: money(after),
					affordable,
				},
				[],
				{
					assumptions: [
						"The result uses the supplied net income and recurring monthly commitments.",
					],
				},
			);
		}
		case "budget": {
			const surplus = new Decimal(input.monthlyIncome)
				.minus(input.monthlyExpenses)
				.minus(input.monthlyDebtPayments);
			return result(
				"budget",
				{
					monthly: surplus,
					annual: surplus.times(12),
					weekly: surplus.times(12).div(52),
				},
				{
					period: input.period,
					monthlyIncome: input.monthlyIncome,
					monthlyExpenses: input.monthlyExpenses,
					monthlyDebtPayments: input.monthlyDebtPayments,
					surplus: money(surplus),
				},
				[],
				{
					items: Object.entries(input.categoryTargets).map(([key, amount]) => ({
						key,
						status: "target",
						amount,
						explanation: "Monthly category target supplied by the household.",
					})),
				},
			);
		}
		case "assessment": {
			const income = new Decimal(input.monthlyNetIncome);
			const outgoings = new Decimal(input.monthlyExpenses);
			const debt = new Decimal(input.totalDebt);
			const assets = new Decimal(input.liquidAssets);
			const surplus = income.minus(outgoings);
			const emergencyMonths = outgoings.gt(0)
				? assets.div(outgoings)
				: new Decimal(0);
			const debtRatio = income.gt(0)
				? debt.div(income.times(12))
				: new Decimal(999);
			let score = 50;
			if (surplus.gt(0)) score += 15;
			else score -= 20;
			if (emergencyMonths.gte(3)) score += 15;
			if (debtRatio.lte(0.5)) score += 10;
			else if (debtRatio.gt(1)) score -= 15;
			if (input.requiredFactsComplete) score += 10;
			return result(
				"assessment",
				{},
				{
					score: Math.max(0, Math.min(100, score)),
					completeness: input.requiredFactsComplete ? 100 : 60,
					monthlySurplus: money(surplus),
					emergencyFundMonths: emergencyMonths.toDecimalPlaces(2).toNumber(),
					debtToAnnualIncome: debtRatio.toDecimalPlaces(4).toNumber(),
				},
				[],
				{
					assumptions: [
						"This is an explainable financial-health indicator, not a credit score or lending decision.",
					],
				},
			);
		}
	}
}
