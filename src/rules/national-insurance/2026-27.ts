import type { NationalInsuranceRuleSet } from "@/rules/registry";

/**
 * National Insurance rules for the 2026–27 tax year.
 *
 * These annualised rules are suitable for financial estimates and
 * affordability calculations.
 *
 * Actual payroll National Insurance is calculated per earnings period,
 * so payroll-exact calculations should use weekly, monthly or other
 * pay-period thresholds rather than annual equivalents.
 */
export const nationalInsuranceRules2026To2027 = {
	taxYear: "2026-27",

	/**
	 * Employee Class 1 primary contributions.
	 *
	 * Uses the standard Category A rates:
	 *
	 * - 0% up to the Primary Threshold
	 * - 8% between the Primary Threshold and Upper Earnings Limit
	 * - 2% above the Upper Earnings Limit
	 */
	employeeClass1: {
		bands: [
			{
				name: "below_primary_threshold",
				from: "0.00",
				to: "12570.00",
				rate: "0",
			},
			{
				name: "main",
				from: "12570.00",
				to: "50270.00",
				rate: "8",
			},
			{
				name: "additional",
				from: "50270.00",
				to: null,
				rate: "2",
			},
		],
	},

	/**
	 * Standard employer Class 1 secondary contributions.
	 *
	 * Employers normally pay 15% above the Secondary Threshold.
	 */
	employerClass1: {
		secondaryThreshold: "5000.00",
		rate: "15",
	},

	/**
	 * Self-employed Class 4 contributions.
	 *
	 * - 0% up to the Lower Profits Limit
	 * - 6% between the Lower Profits Limit and Upper Profits Limit
	 * - 2% above the Upper Profits Limit
	 */
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
				rate: "6",
			},
			{
				name: "additional",
				from: "50270.00",
				to: null,
				rate: "2",
			},
		],
	},
} satisfies NationalInsuranceRuleSet;
