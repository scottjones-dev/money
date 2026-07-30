// src/rules/registry.ts
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import {
	createTaxYear,
	type TaxYear,
} from "@/shared/dates/tax-year";

import { nationalInsuranceRules2025To2026 } from "./national-insurance/2025-26";
import { nationalInsuranceRules2026To2027 } from "./national-insurance/2026-27";

import { incomeTaxRules2025To2026EnglandWalesNorthernIreland } from "./tax/2025-26/england-wales-ni";
import { incomeTaxRules2025To2026Scotland } from "./tax/2025-26/scotland";
import { incomeTaxRules2026To2027EnglandWalesNorthernIreland } from "./tax/2026-27/england-wales-ni";
import { incomeTaxRules2026To2027Scotland } from "./tax/2026-27/scotland";

export const taxJurisdictions = [
	"england",
	"wales",
	"scotland",
	"northern_ireland",
] as const;

export type TaxJurisdiction =
	(typeof taxJurisdictions)[number];

export interface IncomeTaxBand {
	name: string;

	/**
	 * Inclusive lower threshold in annual pounds.
	 */
	from: string;

	/**
	 * Exclusive upper threshold in annual pounds.
	 * Null means the band has no upper limit.
	 */
	to: string | null;

	/**
	 * Percentage rate, for example "20" means 20%.
	 */
	rate: string;
}

export interface IncomeTaxRuleSet {
	taxYear: string;

	jurisdictions: readonly TaxJurisdiction[];

	personalAllowance: string;

	personalAllowanceTaperThreshold: string;

	personalAllowanceTaperRate: string;

	bands: readonly IncomeTaxBand[];
}

export interface NationalInsuranceBand {
	name: string;

	/**
	 * Inclusive lower threshold in annual pounds.
	 */
	from: string;

	/**
	 * Exclusive upper threshold in annual pounds.
	 * Null means the band has no upper limit.
	 */
	to: string | null;

	/**
	 * Percentage rate, for example "8" means 8%.
	 */
	rate: string;
}

export interface NationalInsuranceRuleSet {
	taxYear: string;

	employeeClass1: {
		bands: readonly NationalInsuranceBand[];
	};

	employerClass1?: {
		secondaryThreshold: string;
		rate: string;
	};

	selfEmployedClass4?: {
		bands: readonly NationalInsuranceBand[];
	};
}

export interface RegisteredRuleSet<
	TRules,
> {
	taxYear: TaxYear;
	rules: TRules;
}

const incomeTaxRegistry = new Map<
	string,
	Map<TaxJurisdiction, IncomeTaxRuleSet>
>();

const nationalInsuranceRegistry = new Map<
	string,
	NationalInsuranceRuleSet
>();

function normaliseTaxYearKey(
	taxYear: TaxYear | string | number,
): string {
	if (typeof taxYear === "number") {
		return createTaxYear(taxYear).label;
	}

	if (typeof taxYear === "string") {
		return taxYear;
	}

	return taxYear.label;
}

function registerIncomeTaxRules(
	rules: IncomeTaxRuleSet,
): void {
	let jurisdictionRules = incomeTaxRegistry.get(
		rules.taxYear,
	);

	if (!jurisdictionRules) {
		jurisdictionRules = new Map();
		incomeTaxRegistry.set(
			rules.taxYear,
			jurisdictionRules,
		);
	}

	for (const jurisdiction of rules.jurisdictions) {
		if (jurisdictionRules.has(jurisdiction)) {
			throw new Error(
				`Income-tax rules are already registered for ${rules.taxYear} and ${jurisdiction}.`,
			);
		}

		jurisdictionRules.set(jurisdiction, rules);
	}
}

function registerNationalInsuranceRules(
	rules: NationalInsuranceRuleSet,
): void {
	if (nationalInsuranceRegistry.has(rules.taxYear)) {
		throw new Error(
			`National Insurance rules are already registered for ${rules.taxYear}.`,
		);
	}

	nationalInsuranceRegistry.set(
		rules.taxYear,
		rules,
	);
}

registerIncomeTaxRules(
	incomeTaxRules2025To2026EnglandWalesNorthernIreland,
);

registerIncomeTaxRules(
	incomeTaxRules2025To2026Scotland,
);

registerIncomeTaxRules(
	incomeTaxRules2026To2027EnglandWalesNorthernIreland,
);

registerIncomeTaxRules(
	incomeTaxRules2026To2027Scotland,
);

registerNationalInsuranceRules(
	nationalInsuranceRules2025To2026,
);

registerNationalInsuranceRules(
	nationalInsuranceRules2026To2027,
);

export function getIncomeTaxRules(input: {
	taxYear: TaxYear | string | number;
	jurisdiction: TaxJurisdiction;
}): IncomeTaxRuleSet {
	const taxYear = normaliseTaxYearKey(
		input.taxYear,
	);

	const taxYearRules =
		incomeTaxRegistry.get(taxYear);

	const rules = taxYearRules?.get(
		input.jurisdiction,
	);

	if (!rules) {
		throw new AppError({
			code: ERROR_CODES.UNSUPPORTED_TAX_YEAR,
			message:
				`Income-tax rules are not available for ` +
				`${taxYear} in ${input.jurisdiction}.`,
			statusCode: 422,
			details: [
				{
					field: "taxYear",
					message:
						`No income-tax rule set is registered for ${taxYear}.`,
					value: taxYear,
				},
				{
					field: "jurisdiction",
					message:
						`No income-tax rule set is registered for ${input.jurisdiction}.`,
					value: input.jurisdiction,
				},
			],
		});
	}

	return rules;
}

export function getNationalInsuranceRules(
	taxYearInput: TaxYear | string | number,
): NationalInsuranceRuleSet {
	const taxYear = normaliseTaxYearKey(
		taxYearInput,
	);

	const rules =
		nationalInsuranceRegistry.get(taxYear);

	if (!rules) {
		throw new AppError({
			code: ERROR_CODES.UNSUPPORTED_TAX_YEAR,
			message:
				`National Insurance rules are not available for ${taxYear}.`,
			statusCode: 422,
			details: [
				{
					field: "taxYear",
					message:
						`No National Insurance rule set is registered for ${taxYear}.`,
					value: taxYear,
				},
			],
		});
	}

	return rules;
}

export function hasIncomeTaxRules(input: {
	taxYear: TaxYear | string | number;
	jurisdiction: TaxJurisdiction;
}): boolean {
	const taxYear = normaliseTaxYearKey(
		input.taxYear,
	);

	return (
		incomeTaxRegistry
			.get(taxYear)
			?.has(input.jurisdiction) ?? false
	);
}

export function hasNationalInsuranceRules(
	taxYearInput: TaxYear | string | number,
): boolean {
	return nationalInsuranceRegistry.has(
		normaliseTaxYearKey(taxYearInput),
	);
}

export function listRegisteredIncomeTaxRules(): Array<{
	taxYear: string;
	jurisdiction: TaxJurisdiction;
}> {
	const registered: Array<{
		taxYear: string;
		jurisdiction: TaxJurisdiction;
	}> = [];

	for (const [
		taxYear,
		jurisdictionRules,
	] of incomeTaxRegistry) {
		for (const jurisdiction of jurisdictionRules.keys()) {
			registered.push({
				taxYear,
				jurisdiction,
			});
		}
	}

	return registered.sort((left, right) => {
		const yearComparison =
			left.taxYear.localeCompare(right.taxYear);

		if (yearComparison !== 0) {
			return yearComparison;
		}

		return left.jurisdiction.localeCompare(
			right.jurisdiction,
		);
	});
}

export function listRegisteredNationalInsuranceRules(): string[] {
	return [...nationalInsuranceRegistry.keys()].sort();
}

export function resolveTaxJurisdiction(
	country:
		| "england"
		| "wales"
		| "scotland"
		| "northern_ireland",
): TaxJurisdiction {
	return country;
}