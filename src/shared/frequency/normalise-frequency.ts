// src/shared/frequency/normalise-frequency.ts
import Decimal from "decimal.js";

import { Money, type MoneyInput } from "@/shared/money/money";

export const paymentFrequencies = [
	"weekly",
	"fortnightly",
	"four_weekly",
	"monthly",
	"quarterly",
	"half_yearly",
	"yearly",
	"one_off",
] as const;

export type PaymentFrequency =
	(typeof paymentFrequencies)[number];

export type NormalisedFrequency =
	| "weekly"
	| "monthly"
	| "yearly";

const WEEKS_PER_YEAR = new Decimal(52);
const FORTNIGHTS_PER_YEAR = new Decimal(26);
const FOUR_WEEK_PERIODS_PER_YEAR = new Decimal(13);
const MONTHS_PER_YEAR = new Decimal(12);
const QUARTERS_PER_YEAR = new Decimal(4);
const HALF_YEARS_PER_YEAR = new Decimal(2);

function assertRecurringFrequency(
	frequency: PaymentFrequency,
): asserts frequency is Exclude<PaymentFrequency, "one_off"> {
	if (frequency === "one_off") {
		throw new RangeError(
			"A one-off amount cannot be normalised as recurring income or expenditure.",
		);
	}
}

/**
 * Converts a recurring decimal amount into its annual equivalent.
 *
 * Values are not rounded here. Rounding should happen only when the result is
 * converted into Money, so intermediate calculations retain full precision.
 */
export function normaliseDecimalToYearly(
	amount: Decimal.Value,
	frequency: PaymentFrequency,
): Decimal {
	assertRecurringFrequency(frequency);

	const value = new Decimal(amount);

	switch (frequency) {
		case "weekly":
			return value.times(WEEKS_PER_YEAR);

		case "fortnightly":
			return value.times(FORTNIGHTS_PER_YEAR);

		case "four_weekly":
			return value.times(FOUR_WEEK_PERIODS_PER_YEAR);

		case "monthly":
			return value.times(MONTHS_PER_YEAR);

		case "quarterly":
			return value.times(QUARTERS_PER_YEAR);

		case "half_yearly":
			return value.times(HALF_YEARS_PER_YEAR);

		case "yearly":
			return value;
	}
}

/**
 * Converts a recurring decimal amount into its monthly equivalent.
 *
 * This uses annualisation followed by division by 12. For example:
 *
 * weekly × 52 ÷ 12
 * fortnightly × 26 ÷ 12
 * four-weekly × 13 ÷ 12
 */
export function normaliseDecimalToMonthly(
	amount: Decimal.Value,
	frequency: PaymentFrequency,
): Decimal {
	return normaliseDecimalToYearly(amount, frequency).dividedBy(
		MONTHS_PER_YEAR,
	);
}

/**
 * Converts a recurring decimal amount into its weekly equivalent.
 */
export function normaliseDecimalToWeekly(
	amount: Decimal.Value,
	frequency: PaymentFrequency,
): Decimal {
	return normaliseDecimalToYearly(amount, frequency).dividedBy(
		WEEKS_PER_YEAR,
	);
}

/**
 * Converts an amount from one recurring frequency to another.
 */
export function convertDecimalFrequency(
	amount: Decimal.Value,
	from: PaymentFrequency,
	to: NormalisedFrequency,
): Decimal {
	switch (to) {
		case "weekly":
			return normaliseDecimalToWeekly(amount, from);

		case "monthly":
			return normaliseDecimalToMonthly(amount, from);

		case "yearly":
			return normaliseDecimalToYearly(amount, from);
	}
}

export function normaliseMoneyToWeekly(
	amount: Money,
	frequency: PaymentFrequency,
): Money {
	return Money.from(
		normaliseDecimalToWeekly(
			amount.toDecimal(),
			frequency,
		),
	);
}

export function normaliseMoneyToMonthly(
	amount: Money,
	frequency: PaymentFrequency,
): Money {
	return Money.from(
		normaliseDecimalToMonthly(
			amount.toDecimal(),
			frequency,
		),
	);
}

export function normaliseMoneyToYearly(
	amount: Money,
	frequency: PaymentFrequency,
): Money {
	return Money.from(
		normaliseDecimalToYearly(
			amount.toDecimal(),
			frequency,
		),
	);
}

export function normaliseAmountToWeekly(
	amount: MoneyInput,
	frequency: PaymentFrequency,
): Money {
	return normaliseMoneyToWeekly(
		Money.from(amount),
		frequency,
	);
}

export function normaliseAmountToMonthly(
	amount: MoneyInput,
	frequency: PaymentFrequency,
): Money {
	return normaliseMoneyToMonthly(
		Money.from(amount),
		frequency,
	);
}

export function normaliseAmountToYearly(
	amount: MoneyInput,
	frequency: PaymentFrequency,
): Money {
	return normaliseMoneyToYearly(
		Money.from(amount),
		frequency,
	);
}

export function normaliseMoneyFrequency(
	amount: Money,
	from: PaymentFrequency,
	to: NormalisedFrequency,
): Money {
	return Money.from(
		convertDecimalFrequency(
			amount.toDecimal(),
			from,
			to,
		),
	);
}