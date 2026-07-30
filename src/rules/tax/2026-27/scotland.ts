import type { IncomeTaxRuleSet } from "@/rules/registry";

/**
 * Scottish Income Tax rules.
 *
 * Tax year:
 * 6 April 2026 to 5 April 2027
 *
 * Band thresholds are taxable income after deducting the applicable
 * Personal Allowance.
 *
 * Scottish Income Tax applies to non-savings, non-dividend income.
 * Savings interest and dividend income continue to use UK-wide rules.
 */
export const incomeTaxRules2026To2027Scotland = {
	taxYear: "2026-27",

	jurisdictions: ["scotland"],

	personalAllowance: "12570.00",

	personalAllowanceTaperThreshold: "100000.00",

	/**
	 * £1 of allowance is removed for every £2 above £100,000.
	 */
	personalAllowanceTaperRate: "50",

	bands: [
		{
			name: "starter",
			from: "0.00",
			to: "3967.00",
			rate: "19",
		},
		{
			name: "basic",
			from: "3967.00",
			to: "16956.00",
			rate: "20",
		},
		{
			name: "intermediate",
			from: "16956.00",
			to: "31092.00",
			rate: "21",
		},
		{
			name: "higher",
			from: "31092.00",
			to: "62430.00",
			rate: "42",
		},
		{
			name: "advanced",
			from: "62430.00",
			to: "125140.00",
			rate: "45",
		},
		{
			name: "top",
			from: "125140.00",
			to: null,
			rate: "48",
		},
	],
} satisfies IncomeTaxRuleSet;
