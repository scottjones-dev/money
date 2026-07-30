// src/rules/tax/2025-26/scotland.ts
import type { IncomeTaxRuleSet } from "@/rules/registry";

export const incomeTaxRules2025To2026Scotland = {
	taxYear: "2025-26",
	jurisdictions: ["scotland"],

	personalAllowance: "12570.00",
	personalAllowanceTaperThreshold: "100000.00",
	personalAllowanceTaperRate: "50",

	bands: [],
} satisfies IncomeTaxRuleSet;
