import Decimal from "decimal.js";

import { roundToPence } from "./rounding";

export type MoneyInput = Decimal.Value;

export const GBP_CURRENCY = "GBP" as const;

export interface MoneyJSON {
	amount: string;
	currency: typeof GBP_CURRENCY;
}

export class Money {
	readonly currency = GBP_CURRENCY;

	private readonly value: Decimal;

	private constructor(value: MoneyInput) {
		const decimal = new Decimal(value);

		if (!decimal.isFinite()) {
			throw new RangeError("Money amount must be a finite number.");
		}

		this.value = roundToPence(decimal);
	}

	static zero(): Money {
		return new Money(0);
	}

	static from(value: MoneyInput): Money {
		return new Money(value);
	}

	static fromPence(pence: bigint | number | string): Money {
		return new Money(new Decimal(pence.toString()).dividedBy(100));
	}

	static sum(values: Iterable<Money>): Money {
		let total = new Decimal(0);

		for (const money of values) {
			total = total.plus(money.value);
		}

		return new Money(total);
	}

	add(other: Money): Money {
		return new Money(this.value.plus(other.value));
	}

	subtract(other: Money): Money {
		return new Money(this.value.minus(other.value));
	}

	multiply(multiplier: MoneyInput): Money {
		return new Money(this.value.times(multiplier));
	}

	divide(divisor: MoneyInput): Money {
		const divisorDecimal = new Decimal(divisor);

		if (divisorDecimal.isZero()) {
			throw new RangeError("Cannot divide money by zero.");
		}

		return new Money(this.value.dividedBy(divisorDecimal));
	}

	negate(): Money {
		return new Money(this.value.negated());
	}

	absolute(): Money {
		return new Money(this.value.absoluteValue());
	}

	min(other: Money): Money {
		return this.lessThanOrEqualTo(other) ? this : other;
	}

	max(other: Money): Money {
		return this.greaterThanOrEqualTo(other) ? this : other;
	}

	isZero(): boolean {
		return this.value.isZero();
	}

	isPositive(): boolean {
		return this.value.isPositive() && !this.value.isZero();
	}

	isNegative(): boolean {
		return this.value.isNegative();
	}

	equals(other: Money): boolean {
		return this.value.equals(other.value);
	}

	lessThan(other: Money): boolean {
		return this.value.lessThan(other.value);
	}

	lessThanOrEqualTo(other: Money): boolean {
		return this.value.lessThanOrEqualTo(other.value);
	}

	greaterThan(other: Money): boolean {
		return this.value.greaterThan(other.value);
	}

	greaterThanOrEqualTo(other: Money): boolean {
		return this.value.greaterThanOrEqualTo(other.value);
	}

	toDecimal(): Decimal {
		return new Decimal(this.value);
	}

	toPence(): bigint {
		return BigInt(
			this.value
				.times(100)
				.toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
				.toFixed(0),
		);
	}

	toString(): string {
		return this.value.toFixed(2);
	}

	toNumber(): number {
		return this.value.toNumber();
	}

	toJSON(): MoneyJSON {
		return {
			amount: this.toString(),
			currency: this.currency,
		};
	}
}

export function money(value: MoneyInput): Money {
	return Money.from(value);
}

export function sumMoney(values: Iterable<Money>): Money {
	return Money.sum(values);
}
