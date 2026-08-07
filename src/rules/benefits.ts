export const benefitSchemeKeys = [
	"universal_credit",
	"child_benefit",
	"guardians_allowance",
	"new_style_jsa",
	"new_style_esa",
	"personal_independence_payment",
	"disability_living_allowance",
	"attendance_allowance",
	"carers_allowance",
	"pension_credit",
	"state_pension",
	"maternity_allowance",
	"statutory_maternity_pay",
	"statutory_paternity_pay",
	"statutory_adoption_pay",
	"statutory_shared_parental_pay",
	"statutory_neonatal_pay",
	"statutory_parental_bereavement_pay",
	"statutory_sick_pay",
	"bereavement_support_payment",
	"funeral_expenses_payment",
	"sure_start_maternity_grant",
	"cold_weather_payment",
	"winter_fuel_payment",
	"industrial_injuries_disablement_benefit",
	"armed_forces_independence_payment",
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
	"housing_benefit_legacy",
	"working_tax_credit_legacy",
	"child_tax_credit_legacy",
	"income_support_legacy",
	"income_based_jsa_legacy",
	"income_related_esa_legacy",
] as const;

export type BenefitSchemeKey = (typeof benefitSchemeKeys)[number];
export type SupportedTaxYear =
	| "2022-23"
	| "2023-24"
	| "2024-25"
	| "2025-26"
	| "2026-27";

export interface BenefitRateSet {
	taxYear: SupportedTaxYear;
	effectiveFrom: string;
	effectiveTo: string;
	childBenefitEldest: string;
	childBenefitOther: string;
	guardiansAllowance: string;
	carersAllowance: string;
	carerEarningsLimit: string;
	disabilityDailyStandard: string;
	disabilityDailyEnhanced: string;
	disabilityMobilityStandard: string;
	disabilityMobilityEnhanced: string;
	statePensionFull: string;
	scottishChildPayment: string;
	workingAgePersonalUnder25: string;
	workingAgePersonal25Plus: string;
	statutoryFamilyPay: string;
	statutorySickPay: string;
	pensionCreditSingle: string;
	pensionCreditCouple: string;
	sources: string[];
}

const UK_RATES =
	"https://www.gov.uk/government/collections/benefit-and-pension-rates";
const CHILD_RATES =
	"https://www.gov.uk/government/publications/rates-and-allowances-tax-credits-child-benefit-and-guardians-allowance";
const SCOTTISH_RATES =
	"https://www.gov.scot/publications/social-security-assistance-scotland-up-rating-inflation-2026-27/";

export const benefitRateSets: Record<SupportedTaxYear, BenefitRateSet> = {
	"2022-23": {
		taxYear: "2022-23",
		effectiveFrom: "2022-04-06",
		effectiveTo: "2023-04-05",
		childBenefitEldest: "21.80",
		childBenefitOther: "14.45",
		guardiansAllowance: "18.55",
		carersAllowance: "69.70",
		carerEarningsLimit: "132.00",
		disabilityDailyStandard: "61.85",
		disabilityDailyEnhanced: "92.40",
		disabilityMobilityStandard: "24.45",
		disabilityMobilityEnhanced: "64.50",
		statePensionFull: "185.15",
		workingAgePersonalUnder25: "61.05",
		workingAgePersonal25Plus: "77.00",
		statutoryFamilyPay: "156.66",
		statutorySickPay: "99.35",
		pensionCreditSingle: "182.60",
		pensionCreditCouple: "278.70",
		scottishChildPayment: "25.00",
		sources: [UK_RATES, CHILD_RATES, SCOTTISH_RATES],
	},
	"2023-24": {
		taxYear: "2023-24",
		effectiveFrom: "2023-04-06",
		effectiveTo: "2024-04-05",
		childBenefitEldest: "24.00",
		childBenefitOther: "15.90",
		guardiansAllowance: "20.40",
		carersAllowance: "76.75",
		carerEarningsLimit: "139.00",
		disabilityDailyStandard: "68.10",
		disabilityDailyEnhanced: "101.75",
		disabilityMobilityStandard: "26.90",
		disabilityMobilityEnhanced: "71.00",
		statePensionFull: "203.85",
		workingAgePersonalUnder25: "67.20",
		workingAgePersonal25Plus: "84.80",
		statutoryFamilyPay: "172.48",
		statutorySickPay: "109.40",
		pensionCreditSingle: "201.05",
		pensionCreditCouple: "306.85",
		scottishChildPayment: "25.00",
		sources: [UK_RATES, CHILD_RATES, SCOTTISH_RATES],
	},
	"2024-25": {
		taxYear: "2024-25",
		effectiveFrom: "2024-04-06",
		effectiveTo: "2025-04-05",
		childBenefitEldest: "25.60",
		childBenefitOther: "16.95",
		guardiansAllowance: "21.75",
		carersAllowance: "81.90",
		carerEarningsLimit: "151.00",
		disabilityDailyStandard: "72.65",
		disabilityDailyEnhanced: "108.55",
		disabilityMobilityStandard: "28.70",
		disabilityMobilityEnhanced: "75.75",
		statePensionFull: "221.20",
		workingAgePersonalUnder25: "71.70",
		workingAgePersonal25Plus: "90.50",
		statutoryFamilyPay: "184.03",
		statutorySickPay: "116.75",
		pensionCreditSingle: "218.15",
		pensionCreditCouple: "332.95",
		scottishChildPayment: "26.70",
		sources: [UK_RATES, CHILD_RATES, SCOTTISH_RATES],
	},
	"2025-26": {
		taxYear: "2025-26",
		effectiveFrom: "2025-04-06",
		effectiveTo: "2026-04-05",
		childBenefitEldest: "26.05",
		childBenefitOther: "17.25",
		guardiansAllowance: "22.10",
		carersAllowance: "83.30",
		carerEarningsLimit: "196.00",
		disabilityDailyStandard: "73.90",
		disabilityDailyEnhanced: "110.40",
		disabilityMobilityStandard: "29.20",
		disabilityMobilityEnhanced: "77.05",
		statePensionFull: "230.25",
		workingAgePersonalUnder25: "72.90",
		workingAgePersonal25Plus: "92.05",
		statutoryFamilyPay: "187.18",
		statutorySickPay: "118.75",
		pensionCreditSingle: "227.10",
		pensionCreditCouple: "346.60",
		scottishChildPayment: "27.15",
		sources: [UK_RATES, CHILD_RATES, SCOTTISH_RATES],
	},
	"2026-27": {
		taxYear: "2026-27",
		effectiveFrom: "2026-04-06",
		effectiveTo: "2027-04-05",
		childBenefitEldest: "27.05",
		childBenefitOther: "17.90",
		guardiansAllowance: "22.95",
		carersAllowance: "86.45",
		carerEarningsLimit: "204.00",
		disabilityDailyStandard: "76.70",
		disabilityDailyEnhanced: "114.60",
		disabilityMobilityStandard: "30.30",
		disabilityMobilityEnhanced: "80.00",
		statePensionFull: "241.30",
		workingAgePersonalUnder25: "75.65",
		workingAgePersonal25Plus: "95.55",
		statutoryFamilyPay: "194.32",
		statutorySickPay: "123.25",
		pensionCreditSingle: "238.00",
		pensionCreditCouple: "363.25",
		scottishChildPayment: "28.20",
		sources: [UK_RATES, CHILD_RATES, SCOTTISH_RATES],
	},
};

export function getBenefitRateSet(taxYear: string): BenefitRateSet {
	const rules = benefitRateSets[taxYear as SupportedTaxYear];
	if (!rules) throw new Error(`Benefit rules are unavailable for ${taxYear}.`);
	return rules;
}

export function validateBenefitRuleSets(): string[] {
	const errors: string[] = [];
	for (const year of [
		"2022-23",
		"2023-24",
		"2024-25",
		"2025-26",
		"2026-27",
	] as const) {
		const rules = benefitRateSets[year];
		if (!rules || rules.sources.length === 0)
			errors.push(`Missing or unsourced benefit rules for ${year}.`);
		if (rules && new Date(rules.effectiveFrom) >= new Date(rules.effectiveTo))
			errors.push(`Invalid effective dates for ${year}.`);
	}
	return errors;
}
