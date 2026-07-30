import type { IncomeTaxRuleSet } from "@/rules/registry";

/**
 * Income Tax rules for England, Wales and Northern Ireland.
 *
 * Tax year:
 * 6 April 2026 to 5 April 2027
 *
 * Band thresholds are taxable income after deducting the applicable
 * Personal Allowance.
 *
 * This rule set covers ordinary non-savings, non-dividend income.
 * Savings, dividends and other specialised income types should use
 * separate rule sets.
 */
export const incomeTaxRules2026To2027EnglandWalesNorthernIreland =
	{
		taxYear: "2026-27",

		jurisdictions: [
			"england",
			"wales",
			"northern_ireland",
		],

		personalAllowance: "12570.00",

		/**
		 * The Personal Allowance starts reducing once adjusted net
		 * income exceeds £100,000.
		 */
		personalAllowanceTaperThreshold: "100000.00",

		/**
		 * £1 of allowance is removed for every £2 above the threshold.
		 *
		 * Expressed as 50%.
		 */
		personalAllowanceTaperRate: "50",

		bands: [
			{
				name: "basic",
				from: "0.00",
				to: "37700.00",
				rate: "20",
			},
			{
				name: "higher",
				from: "37700.00",
				to: "125140.00",
				rate: "40",
			},
			{
				name: "additional",
				from: "125140.00",
				to: null,
				rate: "45",
			},
		],
	} satisfies IncomeTaxRuleSet;