// src/rules/tax/2025-26/england-wales-ni.ts
import type { IncomeTaxRuleSet } from "@/rules/registry";

export const incomeTaxRules2025To2026EnglandWalesNorthernIreland = {
	taxYear: "2025-26",

	jurisdictions: ["england", "wales", "northern_ireland"],

	personalAllowance: "12570.00",
	personalAllowanceTaperThreshold: "100000.00",
	personalAllowanceTaperRate: "50",

	bands: [],
} satisfies IncomeTaxRuleSet;
