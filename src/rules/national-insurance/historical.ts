import type { NationalInsuranceRuleSet } from "@/rules/registry";

function rules(
	taxYear: string,
	employeeRate: string,
	selfEmployedRate: string,
): NationalInsuranceRuleSet {
	return {
		taxYear,
		employeeClass1: {
			bands: [
				{
					name: "below_primary_threshold",
					from: "0.00",
					to: "12570.00",
					rate: "0",
				},
				{ name: "main", from: "12570.00", to: "50270.00", rate: employeeRate },
				{ name: "additional", from: "50270.00", to: null, rate: "2" },
			],
		},
		selfEmployedClass4: {
			bands: [
				{
					name: "below_lower_profits_limit",
					from: "0.00",
					to: "12570.00",
					rate: "0",
				},
				{
					name: "main",
					from: "12570.00",
					to: "50270.00",
					rate: selfEmployedRate,
				},
				{ name: "additional", from: "50270.00", to: null, rate: "2" },
			],
		},
	};
}

export const historicalNationalInsuranceRules = [
	rules("2022-23", "12.73", "9.73"),
	rules("2023-24", "11.46", "9"),
	rules("2024-25", "8", "6"),
];
