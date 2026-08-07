import type { IncomeTaxRuleSet } from "@/rules/registry";

const ewBands = (additionalThreshold: string): IncomeTaxRuleSet["bands"] => [
	{ name: "basic", from: "0.00", to: "37700.00", rate: "20" },
	{ name: "higher", from: "37700.00", to: additionalThreshold, rate: "40" },
	{ name: "additional", from: additionalThreshold, to: null, rate: "45" },
];

export const historicalIncomeTaxRules: IncomeTaxRuleSet[] = [
	{
		taxYear: "2022-23",
		jurisdictions: ["england", "wales", "northern_ireland"],
		personalAllowance: "12570.00",
		personalAllowanceTaperThreshold: "100000.00",
		personalAllowanceTaperRate: "50",
		bands: ewBands("150000.00"),
	},
	{
		taxYear: "2023-24",
		jurisdictions: ["england", "wales", "northern_ireland"],
		personalAllowance: "12570.00",
		personalAllowanceTaperThreshold: "100000.00",
		personalAllowanceTaperRate: "50",
		bands: ewBands("125140.00"),
	},
	{
		taxYear: "2024-25",
		jurisdictions: ["england", "wales", "northern_ireland"],
		personalAllowance: "12570.00",
		personalAllowanceTaperThreshold: "100000.00",
		personalAllowanceTaperRate: "50",
		bands: ewBands("125140.00"),
	},
	{
		taxYear: "2022-23",
		jurisdictions: ["scotland"],
		personalAllowance: "12570.00",
		personalAllowanceTaperThreshold: "100000.00",
		personalAllowanceTaperRate: "50",
		bands: [
			{ name: "starter", from: "0.00", to: "2162.00", rate: "19" },
			{ name: "basic", from: "2162.00", to: "13118.00", rate: "20" },
			{ name: "intermediate", from: "13118.00", to: "31318.00", rate: "21" },
			{ name: "higher", from: "31318.00", to: "150000.00", rate: "41" },
			{ name: "top", from: "150000.00", to: null, rate: "46" },
		],
	},
	{
		taxYear: "2023-24",
		jurisdictions: ["scotland"],
		personalAllowance: "12570.00",
		personalAllowanceTaperThreshold: "100000.00",
		personalAllowanceTaperRate: "50",
		bands: [
			{ name: "starter", from: "0.00", to: "2162.00", rate: "19" },
			{ name: "basic", from: "2162.00", to: "13118.00", rate: "20" },
			{ name: "intermediate", from: "13118.00", to: "31092.00", rate: "21" },
			{ name: "higher", from: "31092.00", to: "125140.00", rate: "42" },
			{ name: "top", from: "125140.00", to: null, rate: "47" },
		],
	},
	{
		taxYear: "2024-25",
		jurisdictions: ["scotland"],
		personalAllowance: "12570.00",
		personalAllowanceTaperThreshold: "100000.00",
		personalAllowanceTaperRate: "50",
		bands: [
			{ name: "starter", from: "0.00", to: "2306.00", rate: "19" },
			{ name: "basic", from: "2306.00", to: "13991.00", rate: "20" },
			{ name: "intermediate", from: "13991.00", to: "31092.00", rate: "21" },
			{ name: "higher", from: "31092.00", to: "62430.00", rate: "42" },
			{ name: "advanced", from: "62430.00", to: "125140.00", rate: "45" },
			{ name: "top", from: "125140.00", to: null, rate: "48" },
		],
	},
];
