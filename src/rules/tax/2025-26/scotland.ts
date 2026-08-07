// src/rules/tax/2025-26/scotland.ts
import type { IncomeTaxRuleSet } from "@/rules/registry";

export const incomeTaxRules2025To2026Scotland = {
	taxYear: "2025-26",
	jurisdictions: ["scotland"],

	personalAllowance: "12570.00",
	personalAllowanceTaperThreshold: "100000.00",
	personalAllowanceTaperRate: "50",

	bands: [
		{ name: "starter", from: "0.00", to: "2827.00", rate: "19" },
		{ name: "basic", from: "2827.00", to: "14921.00", rate: "20" },
		{ name: "intermediate", from: "14921.00", to: "31092.00", rate: "21" },
		{ name: "higher", from: "31092.00", to: "62430.00", rate: "42" },
		{ name: "advanced", from: "62430.00", to: "125140.00", rate: "45" },
		{ name: "top", from: "125140.00", to: null, rate: "48" },
	],
} satisfies IncomeTaxRuleSet;
