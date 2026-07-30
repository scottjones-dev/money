import Decimal from "decimal.js";

import { roundToPence } from "./rounding";

export type PercentageValue = Decimal.Value;

export function percentageToRate(percentage: PercentageValue): Decimal {
	return new Decimal(percentage).dividedBy(100);
}

export function rateToPercentage(rate: PercentageValue): Decimal {
	return new Decimal(rate).times(100);
}

export function calculatePercentage(
	amount: Decimal.Value,
	percentage: PercentageValue,
): Decimal {
	return new Decimal(amount).times(percentageToRate(percentage));
}

export function calculatePercentageRounded(
	amount: Decimal.Value,
	percentage: PercentageValue,
): Decimal {
	return roundToPence(calculatePercentage(amount, percentage));
}

export function increaseByPercentage(
	amount: Decimal.Value,
	percentage: PercentageValue,
): Decimal {
	return new Decimal(amount).plus(calculatePercentage(amount, percentage));
}

export function decreaseByPercentage(
	amount: Decimal.Value,
	percentage: PercentageValue,
): Decimal {
	return new Decimal(amount).minus(calculatePercentage(amount, percentage));
}

export function percentageDifference(
	originalAmount: Decimal.Value,
	newAmount: Decimal.Value,
): Decimal {
	const original = new Decimal(originalAmount);

	if (original.isZero()) {
		throw new RangeError("Cannot calculate a percentage difference from zero.");
	}

	return new Decimal(newAmount).minus(original).dividedBy(original).times(100);
}

export function percentageOf(
	part: Decimal.Value,
	total: Decimal.Value,
): Decimal {
	const totalDecimal = new Decimal(total);

	if (totalDecimal.isZero()) {
		throw new RangeError("Cannot calculate a percentage of zero.");
	}

	return new Decimal(part).dividedBy(totalDecimal).times(100);
}

export function clampPercentage(
	percentage: PercentageValue,
	minimum = 0,
	maximum = 100,
): Decimal {
	if (minimum > maximum) {
		throw new RangeError("minimum cannot be greater than maximum.");
	}

	return Decimal.max(minimum, Decimal.min(maximum, new Decimal(percentage)));
}

export function assertValidPercentage(
	percentage: PercentageValue,
	options: {
		minimum?: Decimal.Value;
		maximum?: Decimal.Value;
	} = {},
): Decimal {
	const value = new Decimal(percentage);
	const minimum = new Decimal(options.minimum ?? 0);
	const maximum = new Decimal(options.maximum ?? 100);

	if (value.lessThan(minimum) || value.greaterThan(maximum)) {
		throw new RangeError(
			`Percentage must be between ${minimum.toString()} and ${maximum.toString()}.`,
		);
	}

	return value;
}
