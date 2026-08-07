import Decimal from "decimal.js";
import {
	type BenefitSchemeKey,
	benefitSchemeKeys,
	getBenefitRateSet,
} from "@/rules/benefits";
import type {
	CalculationInput,
	CalculationOutput,
} from "./calculations.schemas";

type BenefitsInput = Extract<CalculationInput, { calculator: "benefits" }>;
type BenefitItem = CalculationOutput["items"][number];
export interface StoredBenefitFacts {
	existingAwards?: Array<{
		schemeKey: string;
		amount: string;
		frequency: "weekly" | "four_weekly" | "monthly" | "yearly" | "one_off";
	}>;
	qualifyingBenefitReceived?: boolean | null;
	statePensionQualifyingYears?: number | null;
}

const money = (value: Decimal.Value) =>
	new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
const monthly = (weekly: Decimal.Value) =>
	money(new Decimal(weekly).times(52).div(12));
const annual = (weekly: Decimal.Value) => money(new Decimal(weekly).times(52));
const weeklyFromAward = (amount: string, frequency: string) => {
	const value = new Decimal(amount);
	if (frequency === "weekly") return value;
	if (frequency === "four_weekly") return value.div(4);
	if (frequency === "monthly") return value.times(12).div(52);
	if (frequency === "yearly") return value.div(52);
	return new Decimal(0);
};

const scottishOnly = new Set<BenefitSchemeKey>([
	"scottish_child_payment",
	"best_start_grant",
	"best_start_foods",
	"adult_disability_payment",
	"child_disability_payment",
	"pension_age_disability_payment",
	"carer_support_payment",
	"job_start_payment",
	"funeral_support_payment",
	"winter_heating_payment",
]);
const legacy = new Set<BenefitSchemeKey>([
	"housing_benefit_legacy",
	"working_tax_credit_legacy",
	"child_tax_credit_legacy",
	"income_support_legacy",
	"income_based_jsa_legacy",
	"income_related_esa_legacy",
]);

function item(
	key: BenefitSchemeKey,
	status: string,
	explanation: string,
	ruleSetKey: string,
	sources: string[],
	weeklyAmount: Decimal.Value | null = null,
	extra: Partial<BenefitItem> = {},
): BenefitItem {
	const weekly = weeklyAmount == null ? null : money(weeklyAmount);
	return {
		key,
		benefitSchemeKey: key,
		status,
		explanation,
		amount: weekly,
		weeklyAmount: weekly,
		monthlyAmount: weekly == null ? null : monthly(weekly),
		annualAmount: weekly == null ? null : annual(weekly),
		confirmed: status === "estimated_eligible" || status === "declared_award",
		missingFacts: [],
		conflictGroup: null,
		ruleSetKey,
		sources,
		scenarios: [],
		...extra,
	};
}

function disabilityScenarios(rules: ReturnType<typeof getBenefitRateSet>) {
	return [
		{
			outcome: "enhanced_daily_living_and_mobility",
			weeklyAmount: money(
				new Decimal(rules.disabilityDailyEnhanced).plus(
					rules.disabilityMobilityEnhanced,
				),
			),
			explanation:
				"Maximum combined illustration if both enhanced components are officially awarded.",
		},
		{
			outcome: "daily_living_standard",
			weeklyAmount: rules.disabilityDailyStandard,
			explanation:
				"Standard daily-living outcome if awarded by the official assessment.",
		},
		{
			outcome: "daily_living_enhanced",
			weeklyAmount: rules.disabilityDailyEnhanced,
			explanation:
				"Enhanced daily-living outcome if awarded by the official assessment.",
		},
		{
			outcome: "mobility_standard",
			weeklyAmount: rules.disabilityMobilityStandard,
			explanation:
				"Standard mobility outcome if awarded by the official assessment.",
		},
		{
			outcome: "mobility_enhanced",
			weeklyAmount: rules.disabilityMobilityEnhanced,
			explanation:
				"Enhanced mobility outcome if awarded by the official assessment.",
		},
	];
}

export function calculateBenefitsAssessment(
	input: BenefitsInput,
	nation: string,
	stored: StoredBenefitFacts = {},
): CalculationOutput {
	const rules = getBenefitRateSet(input.taxYear);
	const ruleSetKey = `benefits-${input.taxYear}-${nation}-v1`;
	const facts = input.facts;
	const awards = [
		...(input.useStoredFacts ? (stored.existingAwards ?? []) : []),
		...(facts?.existingAwards ?? []),
	];
	const awardByKey = new Map(awards.map((award) => [award.schemeKey, award]));
	const children = facts?.children ?? [];
	const childCount = children.length || input.dependentChildren;
	const qualifyingBenefit =
		facts?.qualifyingBenefitReceived ??
		stored.qualifyingBenefitReceived ??
		null;
	const items: BenefitItem[] = [];

	for (const key of benefitSchemeKeys) {
		const declared = awardByKey.get(key);
		if (declared) {
			items.push(
				item(
					key,
					"declared_award",
					"The supplied current award is included without reassessing official eligibility.",
					ruleSetKey,
					rules.sources,
					weeklyFromAward(declared.amount, declared.frequency),
				),
			);
			continue;
		}
		if (scottishOnly.has(key) && nation !== "scotland") {
			items.push(
				item(
					key,
					"not_applicable",
					"This devolved scheme does not apply outside Scotland.",
					ruleSetKey,
					rules.sources,
				),
			);
			continue;
		}
		if (legacy.has(key)) {
			items.push(
				item(
					key,
					"legacy_declared_only",
					"New entitlement is not calculated; supply an existing award or transitional protection.",
					ruleSetKey,
					rules.sources,
					null,
					{ conflictGroup: "legacy_or_universal_credit" },
				),
			);
			continue;
		}
		switch (key) {
			case "child_benefit": {
				if (childCount === 0)
					items.push(
						item(
							key,
							"not_eligible",
							"No dependent children were supplied.",
							ruleSetKey,
							rules.sources,
						),
					);
				else {
					const value = new Decimal(rules.childBenefitEldest).plus(
						new Decimal(rules.childBenefitOther).times(childCount - 1),
					);
					items.push(
						item(
							key,
							"estimated_eligible",
							"Estimated before any High Income Child Benefit Charge.",
							ruleSetKey,
							rules.sources,
							value,
						),
					);
				}
				break;
			}
			case "guardians_allowance": {
				const count = facts?.guardianChildren ?? 0;
				items.push(
					count > 0
						? item(
								key,
								"estimated_eligible",
								"Calculated from the declared number of qualifying guardian children.",
								ruleSetKey,
								rules.sources,
								new Decimal(rules.guardiansAllowance).times(count),
							)
						: item(
								key,
								"missing_facts",
								"Guardian responsibility must be supplied.",
								ruleSetKey,
								rules.sources,
								null,
								{ missingFacts: ["facts.guardianChildren"] },
							),
				);
				break;
			}
			case "carers_allowance":
			case "carer_support_payment": {
				const applicable =
					!input.statePensionAge &&
					key ===
						(nation === "scotland"
							? "carer_support_payment"
							: "carers_allowance");
				if (!applicable)
					items.push(
						item(
							key,
							"not_applicable",
							"The equivalent carer scheme applies in this nation.",
							ruleSetKey,
							rules.sources,
							null,
							{ conflictGroup: "carer_payment" },
						),
					);
				else if (!input.caring35Hours)
					items.push(
						item(
							key,
							"not_eligible",
							"At least 35 hours of qualifying care was not declared.",
							ruleSetKey,
							rules.sources,
						),
					);
				else if (new Decimal(input.weeklyEarnings).gt(rules.carerEarningsLimit))
					items.push(
						item(
							key,
							"not_eligible",
							"Weekly earnings exceed the applicable earnings limit.",
							ruleSetKey,
							rules.sources,
						),
					);
				else
					items.push(
						item(
							key,
							"estimated_eligible",
							"The care-hours and earnings tests are satisfied; the official decision may require more evidence.",
							ruleSetKey,
							rules.sources,
							rules.carersAllowance,
						),
					);
				break;
			}
			case "personal_independence_payment":
			case "adult_disability_payment": {
				const applicable =
					!input.statePensionAge &&
					key ===
						(nation === "scotland"
							? "adult_disability_payment"
							: "personal_independence_payment");
				if (!applicable)
					items.push(
						item(
							key,
							"not_applicable",
							"The equivalent disability scheme applies in this nation.",
							ruleSetKey,
							rules.sources,
							null,
							{ conflictGroup: "adult_disability" },
						),
					);
				else if (!input.disabled)
					items.push(
						item(
							key,
							"not_indicated",
							"No disability circumstance was declared.",
							ruleSetKey,
							rules.sources,
						),
					);
				else {
					const outcome = facts?.disabilityOutcome;
					const daily =
						outcome?.dailyLiving === "standard"
							? rules.disabilityDailyStandard
							: outcome?.dailyLiving === "enhanced"
								? rules.disabilityDailyEnhanced
								: "0";
					const mobility =
						outcome?.mobility === "standard"
							? rules.disabilityMobilityStandard
							: outcome?.mobility === "enhanced"
								? rules.disabilityMobilityEnhanced
								: "0";
					const confirmed = new Decimal(daily).plus(mobility);
					items.push(
						confirmed.gt(0)
							? item(
									key,
									"declared_assessment_outcome",
									"Calculated from the official outcome declared by the caller.",
									ruleSetKey,
									rules.sources,
									confirmed,
									{ confirmed: true, conflictGroup: "adult_disability" },
								)
							: item(
									key,
									"official_assessment_required",
									"Possible component rates are shown without predicting the official assessment.",
									ruleSetKey,
									rules.sources,
									null,
									{
										conflictGroup: "adult_disability",
										missingFacts: ["facts.disabilityOutcome"],
										scenarios: disabilityScenarios(rules),
									},
								),
					);
				}
				break;
			}
			case "attendance_allowance":
			case "pension_age_disability_payment": {
				const applicable =
					input.statePensionAge &&
					key ===
						(nation === "scotland"
							? "pension_age_disability_payment"
							: "attendance_allowance");
				if (!applicable)
					items.push(
						item(
							key,
							"not_applicable",
							"This pension-age disability scheme does not match the claimant circumstances or nation.",
							ruleSetKey,
							rules.sources,
						),
					);
				else if (
					facts?.attendanceOutcome === "lower" ||
					facts?.attendanceOutcome === "higher"
				) {
					const value =
						facts.attendanceOutcome === "higher"
							? rules.disabilityDailyEnhanced
							: rules.disabilityDailyStandard;
					items.push(
						item(
							key,
							"declared_assessment_outcome",
							"Calculated from the declared official attendance outcome.",
							ruleSetKey,
							rules.sources,
							value,
							{ confirmed: true },
						),
					);
				} else
					items.push(
						item(
							key,
							"official_assessment_required",
							"Lower and higher rate scenarios require an official care-needs decision.",
							ruleSetKey,
							rules.sources,
							null,
							{
								scenarios: [
									{
										outcome: "lower",
										weeklyAmount: rules.disabilityDailyStandard,
										explanation: "Lower-rate outcome.",
									},
									{
										outcome: "higher",
										weeklyAmount: rules.disabilityDailyEnhanced,
										explanation: "Higher-rate outcome.",
									},
								],
							},
						),
					);
				break;
			}
			case "disability_living_allowance":
			case "child_disability_payment": {
				const applicable =
					key ===
					(nation === "scotland"
						? "child_disability_payment"
						: "disability_living_allowance");
				if (!applicable) {
					items.push(
						item(
							key,
							"not_applicable",
							"The equivalent child disability scheme applies in this nation.",
							ruleSetKey,
							rules.sources,
						),
					);
					break;
				}
				const affected = children.filter(
					(child) =>
						child.disabilityCareOutcome !== "none" ||
						child.disabilityMobilityOutcome !== "none",
				);
				if (affected.length === 0) {
					items.push(
						item(
							key,
							children.length === 0 ? "missing_facts" : "not_indicated",
							"Child disability assessment outcomes were not supplied.",
							ruleSetKey,
							rules.sources,
							null,
							{ missingFacts: children.length === 0 ? ["facts.children"] : [] },
						),
					);
					break;
				}
				let confirmed = new Decimal(0);
				let pending = 0;
				for (const child of affected) {
					if (child.disabilityCareOutcome === "pending") pending += 1;
					else if (child.disabilityCareOutcome === "highest")
						confirmed = confirmed.plus(rules.disabilityDailyEnhanced);
					else if (child.disabilityCareOutcome === "middle")
						confirmed = confirmed.plus(rules.disabilityDailyStandard);
					else if (child.disabilityCareOutcome === "lowest")
						confirmed = confirmed.plus(rules.disabilityMobilityStandard);
					if (child.disabilityMobilityOutcome === "pending") pending += 1;
					else if (child.disabilityMobilityOutcome === "higher")
						confirmed = confirmed.plus(rules.disabilityMobilityEnhanced);
					else if (child.disabilityMobilityOutcome === "lower")
						confirmed = confirmed.plus(rules.disabilityMobilityStandard);
				}
				items.push(
					item(
						key,
						confirmed.gt(0)
							? "declared_assessment_outcome"
							: "official_assessment_required",
						"Calculated components use declared official outcomes; pending outcomes remain conditional.",
						ruleSetKey,
						rules.sources,
						confirmed.gt(0) ? confirmed : null,
						{
							confirmed: confirmed.gt(0),
							scenarios:
								pending > 0
									? [
											{
												outcome: "maximum_pending_components",
												weeklyAmount: money(
													new Decimal(rules.disabilityDailyEnhanced)
														.plus(rules.disabilityMobilityEnhanced)
														.times(affected.length),
												),
												explanation:
													"Upper illustration if maximum care and mobility components are officially awarded.",
											},
										]
									: [],
						},
					),
				);
				break;
			}
			case "state_pension": {
				const years =
					facts?.statePensionQualifyingYears ??
					stored.statePensionQualifyingYears;
				if (!input.statePensionAge)
					items.push(
						item(
							key,
							"not_eligible",
							"The claimant is not declared to be of State Pension age.",
							ruleSetKey,
							rules.sources,
						),
					);
				else if (years == null)
					items.push(
						item(
							key,
							"official_record_required",
							"A National Insurance record is needed; full-rate and zero-rate boundaries are shown.",
							ruleSetKey,
							rules.sources,
							null,
							{
								missingFacts: ["facts.statePensionQualifyingYears"],
								scenarios: [
									{
										outcome: "full_new_state_pension",
										weeklyAmount: rules.statePensionFull,
										explanation:
											"Illustrative full new State Pension with at least 35 qualifying years, subject to the official record.",
									},
								],
							},
						),
					);
				else
					items.push(
						item(
							key,
							"estimated_eligible",
							"Pro-rated illustration using declared qualifying years; contracted-out and pre-2016 history may change it.",
							ruleSetKey,
							rules.sources,
							new Decimal(rules.statePensionFull)
								.times(Math.min(years, 35))
								.div(35),
						),
					);
				break;
			}
			case "new_style_jsa":
			case "new_style_esa": {
				const contributionMet = facts?.contributionConditionsMet;
				const rate =
					input.age < 25
						? rules.workingAgePersonalUnder25
						: rules.workingAgePersonal25Plus;
				if (input.statePensionAge)
					items.push(
						item(
							key,
							"not_eligible",
							"The claimant is over the working-age limit.",
							ruleSetKey,
							rules.sources,
						),
					);
				else if (
					contributionMet === true &&
					input.declaredSchemeKeys.includes(key)
				)
					items.push(
						item(
							key,
							"estimated_eligible",
							"Personal allowance estimated from the declared contribution condition and claim circumstances.",
							ruleSetKey,
							rules.sources,
							rate,
						),
					);
				else if (
					contributionMet == null &&
					!input.declaredSchemeKeys.includes(key)
				)
					items.push(
						item(
							key,
							"not_indicated",
							"No contribution-based claim circumstance was declared.",
							ruleSetKey,
							rules.sources,
						),
					);
				else
					items.push(
						item(
							key,
							"official_record_required",
							"Contribution history and work-capability or availability conditions require an official decision.",
							ruleSetKey,
							rules.sources,
							null,
							{
								missingFacts: ["facts.contributionConditionsMet"],
								scenarios: [
									{
										outcome: "personal_allowance",
										weeklyAmount: rate,
										explanation:
											"Illustrative personal allowance if official contribution and eligibility tests are met.",
									},
								],
							},
						),
					);
				break;
			}
			case "pension_credit": {
				if (!input.statePensionAge) {
					items.push(
						item(
							key,
							"not_eligible",
							"The claimant is not declared to be of Pension Credit age.",
							ruleSetKey,
							rules.sources,
						),
					);
					break;
				}
				const guarantee = new Decimal(
					input.partner ? rules.pensionCreditCouple : rules.pensionCreditSingle,
				);
				const tariff = Decimal.max(
					0,
					new Decimal(input.capital).minus(10000).div(500).ceil(),
				);
				const estimate = Decimal.max(
					0,
					guarantee.minus(input.weeklyEarnings).minus(tariff),
				);
				items.push(
					item(
						key,
						estimate.gt(0) ? "estimated_eligible" : "not_eligible",
						"Guarantee Credit estimate using supplied weekly income and capital tariff income; pension and partner income must be included by the caller.",
						ruleSetKey,
						rules.sources,
						estimate,
					),
				);
				break;
			}
			case "maternity_allowance":
			case "statutory_maternity_pay":
			case "statutory_paternity_pay":
			case "statutory_adoption_pay":
			case "statutory_shared_parental_pay":
			case "statutory_neonatal_pay":
			case "statutory_parental_bereavement_pay": {
				const indicated =
					input.pregnantOrNewParent ||
					input.declaredSchemeKeys.includes(key) ||
					(key === "statutory_parental_bereavement_pay" && input.bereaved);
				items.push(
					item(
						key,
						indicated ? "official_employment_check_required" : "not_indicated",
						indicated
							? "The statutory standard-rate scenario is shown; service, earnings and leave conditions require employer or official confirmation."
							: "The supplied facts do not indicate this statutory payment.",
						ruleSetKey,
						rules.sources,
						null,
						indicated
							? {
									scenarios: [
										{
											outcome: "standard_rate",
											weeklyAmount: rules.statutoryFamilyPay,
											explanation:
												"Maximum standard weekly rate; earnings-related limits can reduce payment.",
										},
									],
									missingFacts: ["employmentServiceAndAverageWeeklyEarnings"],
								}
							: {},
					),
				);
				break;
			}
			case "scottish_child_payment": {
				if (childCount === 0)
					items.push(
						item(
							key,
							"not_eligible",
							"No dependent children were supplied.",
							ruleSetKey,
							rules.sources,
						),
					);
				else if (qualifyingBenefit === true)
					items.push(
						item(
							key,
							"estimated_eligible",
							"Calculated for supplied children on the basis that a qualifying benefit is received.",
							ruleSetKey,
							rules.sources,
							new Decimal(rules.scottishChildPayment).times(
								children.filter((child) => child.age < 16).length || childCount,
							),
						),
					);
				else
					items.push(
						item(
							key,
							qualifyingBenefit === false ? "not_eligible" : "missing_facts",
							"Receipt of a qualifying benefit must be confirmed.",
							ruleSetKey,
							rules.sources,
							null,
							{
								missingFacts:
									qualifyingBenefit == null
										? ["facts.qualifyingBenefitReceived"]
										: [],
							},
						),
					);
				break;
			}
			default: {
				const indicated =
					input.declaredSchemeKeys.includes(key) ||
					(input.pregnantOrNewParent &&
						[
							"maternity_allowance",
							"statutory_maternity_pay",
							"statutory_paternity_pay",
							"statutory_adoption_pay",
							"statutory_shared_parental_pay",
							"statutory_neonatal_pay",
						].includes(key)) ||
					(input.bereaved &&
						[
							"bereavement_support_payment",
							"funeral_expenses_payment",
							"funeral_support_payment",
						].includes(key));
				items.push(
					item(
						key,
						indicated ? "official_assessment_required" : "not_indicated",
						indicated
							? "The scheme is relevant, but employment, contribution, assessment-period, or official-decision facts are incomplete."
							: "The supplied facts do not currently indicate this scheme.",
						ruleSetKey,
						rules.sources,
						null,
						{ missingFacts: indicated ? ["schemeSpecificEvidence"] : [] },
					),
				);
			}
		}
	}

	const confirmed = items
		.filter((entry) => entry.confirmed && entry.weeklyAmount)
		.reduce((sum, entry) => sum.plus(entry.weeklyAmount ?? 0), new Decimal(0));
	const conditionalMaximum = items.reduce((sum, entry) => {
		const maximum = (entry.scenarios ?? []).reduce(
			(current, scenario) => Decimal.max(current, scenario.weeklyAmount),
			new Decimal(0),
		);
		return sum.plus(maximum);
	}, new Decimal(0));
	const missing = new Set(items.flatMap((entry) => entry.missingFacts ?? []));
	const completeness = Math.max(0, Math.round(100 - (missing.size / 12) * 100));
	const conflicts =
		items.some(
			(entry) => legacy.has(entry.key as BenefitSchemeKey) && entry.confirmed,
		) &&
		items.some((entry) => entry.key === "universal_credit" && entry.confirmed)
			? [
					"Legacy means-tested awards and Universal Credit require transitional/migration review.",
				]
			: [];
	return {
		type: "benefits",
		weeklyAmount: money(confirmed),
		monthlyAmount: monthly(confirmed),
		annualAmount: annual(confirmed),
		values: {
			nation,
			catalogSize: benefitSchemeKeys.length,
			confirmedSchemes: items.filter((entry) => entry.confirmed).length,
			conditionalSchemes: items.filter(
				(entry) => (entry.scenarios?.length ?? 0) > 0,
			).length,
		},
		items,
		schedule: [],
		assumptions: [
			"Confirmed totals exclude conditional scenarios and mutually exclusive alternatives.",
			"Official agencies decide eligibility and may use facts not represented here.",
		],
		sources: rules.sources,
		benefitAssessment: {
			confirmedWeeklyAmount: money(confirmed),
			confirmedMonthlyAmount: monthly(confirmed),
			confirmedAnnualAmount: annual(confirmed),
			conditionalMinimumWeeklyAmount: "0.00",
			conditionalMaximumWeeklyAmount: money(conditionalMaximum),
			completeness,
			conflicts,
		},
	};
}
