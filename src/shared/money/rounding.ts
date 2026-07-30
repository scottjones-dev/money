import Decimal from "decimal.js";

export type MoneyRoundingMode =
	| "half_up"
	| "half_even"
	| "down"
	| "up"
	| "floor"
	| "ceil";

function resolveRoundingMode(
	mode: MoneyRoundingMode,
): Decimal.Rounding {
	switch (mode) {
		case "half_up":
			return Decimal.ROUND_HALF_UP;

		case "half_even":
			return Decimal.ROUND_HALF_EVEN;

		case "down":
			return Decimal.ROUND_DOWN;

		case "up":
			return Decimal.ROUND_UP;

		case "floor":
			return Decimal.ROUND_FLOOR;

		case "ceil":
			return Decimal.ROUND_CEIL;
	}
}

export function roundDecimal(
	value: Decimal.Value,
	decimalPlaces: number,
	mode: MoneyRoundingMode = "half_up",
): Decimal {
	if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
		throw new RangeError(
			"decimalPlaces must be a non-negative integer.",
		);
	}

	return new Decimal(value).toDecimalPlaces(
		decimalPlaces,
		resolveRoundingMode(mode),
	);
}

export function roundToPence(
	value: Decimal.Value,
	mode: MoneyRoundingMode = "half_up",
): Decimal {
	return roundDecimal(value, 2, mode);
}

export function roundToPounds(
	value: Decimal.Value,
	mode: MoneyRoundingMode = "half_up",
): Decimal {
	return roundDecimal(value, 0, mode);
}

export function truncateToPence(
	value: Decimal.Value,
): Decimal {
	return roundToPence(value, "down");
}

export function floorToPounds(
	value: Decimal.Value,
): Decimal {
	return roundToPounds(value, "floor");
}

export function ceilToPounds(
	value: Decimal.Value,
): Decimal {
	return roundToPounds(value, "ceil");
}