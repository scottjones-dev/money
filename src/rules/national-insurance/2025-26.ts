// src/rules/national-insurance/2025-26.ts
import type { NationalInsuranceRuleSet } from "@/rules/registry";

export const nationalInsuranceRules2025To2026 = {
	taxYear: "2025-26",

	employeeClass1: {
		bands: [
			{
				name: "below_primary_threshold",
				from: "0.00",
				to: "12570.00",
				rate: "0",
			},
			{ name: "main", from: "12570.00", to: "50270.00", rate: "8" },
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
			{ name: "main", from: "12570.00", to: "50270.00", rate: "6" },
			{ name: "additional", from: "50270.00", to: null, rate: "2" },
		],
	},
} satisfies NationalInsuranceRuleSet;
