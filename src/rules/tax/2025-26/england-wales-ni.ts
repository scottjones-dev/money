// src/rules/tax/2025-26/england-wales-ni.ts
import type { IncomeTaxRuleSet } from "@/rules/registry";

export const incomeTaxRules2025To2026EnglandWalesNorthernIreland = {
	taxYear: "2025-26",

	jurisdictions: ["england", "wales", "northern_ireland"],

	personalAllowance: "12570.00",
	personalAllowanceTaperThreshold: "100000.00",
	personalAllowanceTaperRate: "50",

	bands: [
		{ name: "basic", from: "0.00", to: "37700.00", rate: "20" },
		{ name: "higher", from: "37700.00", to: "125140.00", rate: "40" },
		{ name: "additional", from: "125140.00", to: null, rate: "45" },
	],
} satisfies IncomeTaxRuleSet;
