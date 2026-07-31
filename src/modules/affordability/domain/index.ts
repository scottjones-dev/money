// src/modules/affordability/domain/index.ts
import Decimal from "decimal.js";

import { Money } from "@/shared/money/money";
import {
	calculatePercentage,
	percentageToRate,
} from "@/shared/money/percentages";

export const affordabilityRatings = [
	"comfortable",
	"manageable",
	"stretched",
	"unaffordable",
] as const;

export type AffordabilityRating = (typeof affordabilityRatings)[number];

export interface AffordabilityIncomeInput {
	grossMonthlyIncome: Money;
	netMonthlyIncome: Money;
	benefitIncome: Money;
	otherIncome: Money;
}

export interface AffordabilityExpenseInput {
	essentialExpenses: Money;
	importantExpenses: Money;
	discretionaryExpenses: Money;
	debtPayments: Money;
	housingCosts: Money;
}

export interface AffordabilityInput {
	income: AffordabilityIncomeInput;
	expenses: AffordabilityExpenseInput;

	/**
	 * Optional proposed additional monthly commitment.
	 *
	 * Examples:
	 * - proposed loan payment
	 * - proposed rent increase
	 * - proposed finance payment
	 */
	proposedMonthlyCommitment?: Money;

	/**
	 * Minimum monthly buffer the household wants to retain after expenses.
	 */
	requiredMonthlyBuffer?: Money;

	/**
	 * Maximum acceptable percentage of net income spent on debt payments.
	 *
	 * Example:
	 * "40" means 40%.
	 */
	maximumDebtToIncomePercentage?: Decimal.Value;
}

export interface AffordabilityRatios {
	housingCostPercentage: string;
	debtToIncomePercentage: string;
	essentialCostPercentage: string;
	totalExpensePercentage: string;
	disposableIncomePercentage: string;
}

export interface AffordabilityResult {
	totalMonthlyIncome: Money;
	totalMonthlyExpenses: Money;

	currentDisposableIncome: Money;
	projectedDisposableIncome: Money;

	requiredMonthlyBuffer: Money;
	availableAfterBuffer: Money;

	proposedMonthlyCommitment: Money;

	ratios: AffordabilityRatios;

	rating: AffordabilityRating;

	isAffordable: boolean;

	reasons: string[];
}

const DEFAULT_REQUIRED_BUFFER = Money.from("100.00");
const DEFAULT_MAXIMUM_DEBT_TO_INCOME_PERCENTAGE = new Decimal(40);

function percentageOfIncome(amount: Money, totalIncome: Money): string {
	if (totalIncome.isZero()) {
		return "0.00";
	}

	return calculatePercentage(amount.toDecimal(), totalIncome.toDecimal())
		.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
		.toFixed(2);
}

function calculateRating(input: {
	projectedDisposableIncome: Money;
	requiredMonthlyBuffer: Money;
	totalMonthlyIncome: Money;
	totalMonthlyExpenses: Money;
	debtToIncomePercentage: Decimal;
	maximumDebtToIncomePercentage: Decimal;
}): AffordabilityRating {
	if (
		input.projectedDisposableIncome.isNegative() ||
		input.debtToIncomePercentage.greaterThan(
			input.maximumDebtToIncomePercentage,
		)
	) {
		return "unaffordable";
	}

	if (input.projectedDisposableIncome.lessThan(input.requiredMonthlyBuffer)) {
		return "stretched";
	}

	const remainingIncomeRate = input.totalMonthlyIncome.isZero()
		? new Decimal(0)
		: input.projectedDisposableIncome
				.toDecimal()
				.div(input.totalMonthlyIncome.toDecimal());

	if (remainingIncomeRate.greaterThanOrEqualTo(0.2)) {
		return "comfortable";
	}

	return "manageable";
}

function createReasons(input: {
	totalMonthlyIncome: Money;
	projectedDisposableIncome: Money;
	requiredMonthlyBuffer: Money;
	debtToIncomePercentage: Decimal;
	maximumDebtToIncomePercentage: Decimal;
}): string[] {
	const reasons: string[] = [];

	if (input.totalMonthlyIncome.isZero()) {
		reasons.push("No monthly household income has been recorded.");
	}

	if (input.projectedDisposableIncome.isNegative()) {
		reasons.push(
			"The proposed commitment would leave the household with a monthly deficit.",
		);
	}

	if (input.projectedDisposableIncome.lessThan(input.requiredMonthlyBuffer)) {
		reasons.push(
			"The proposed commitment would leave less than the required monthly safety buffer.",
		);
	}

	if (
		input.debtToIncomePercentage.greaterThan(
			input.maximumDebtToIncomePercentage,
		)
	) {
		reasons.push(
			"The household debt-payment ratio exceeds the configured maximum.",
		);
	}

	if (reasons.length === 0) {
		reasons.push(
			"The household remains within the configured affordability limits.",
		);
	}

	return reasons;
}

export function calculateAffordability(
	input: AffordabilityInput,
): AffordabilityResult {
	const proposedMonthlyCommitment =
		input.proposedMonthlyCommitment ?? Money.zero();

	const requiredMonthlyBuffer =
		input.requiredMonthlyBuffer ?? DEFAULT_REQUIRED_BUFFER;

	const maximumDebtToIncomePercentage = new Decimal(
		input.maximumDebtToIncomePercentage ??
			DEFAULT_MAXIMUM_DEBT_TO_INCOME_PERCENTAGE,
	);

	const totalMonthlyIncome = Money.sum([
		input.income.netMonthlyIncome,
		input.income.benefitIncome,
		input.income.otherIncome,
	]);

	const totalMonthlyExpenses = Money.sum([
		input.expenses.essentialExpenses,
		input.expenses.importantExpenses,
		input.expenses.discretionaryExpenses,
		input.expenses.debtPayments,
	]);

	const currentDisposableIncome =
		totalMonthlyIncome.subtract(totalMonthlyExpenses);

	const projectedDisposableIncome = currentDisposableIncome.subtract(
		proposedMonthlyCommitment,
	);

	const availableAfterBuffer = projectedDisposableIncome.subtract(
		requiredMonthlyBuffer,
	);

	const housingCostPercentage = percentageOfIncome(
		input.expenses.housingCosts,
		totalMonthlyIncome,
	);

	const debtPaymentsIncludingProposal = input.expenses.debtPayments.add(
		proposedMonthlyCommitment,
	);

	const debtToIncomePercentageDecimal = totalMonthlyIncome.isZero()
		? new Decimal(0)
		: debtPaymentsIncludingProposal
				.toDecimal()
				.div(totalMonthlyIncome.toDecimal())
				.mul(100);

	const debtToIncomePercentage = debtToIncomePercentageDecimal
		.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
		.toFixed(2);

	const essentialCostPercentage = percentageOfIncome(
		input.expenses.essentialExpenses,
		totalMonthlyIncome,
	);

	const totalExpensePercentage = percentageOfIncome(
		totalMonthlyExpenses.add(proposedMonthlyCommitment),
		totalMonthlyIncome,
	);

	const disposableIncomePercentage = percentageOfIncome(
		projectedDisposableIncome,
		totalMonthlyIncome,
	);

	const rating = calculateRating({
		projectedDisposableIncome,
		requiredMonthlyBuffer,
		totalMonthlyIncome,
		totalMonthlyExpenses,
		debtToIncomePercentage: debtToIncomePercentageDecimal,
		maximumDebtToIncomePercentage,
	});

	const reasons = createReasons({
		totalMonthlyIncome,
		projectedDisposableIncome,
		requiredMonthlyBuffer,
		debtToIncomePercentage: debtToIncomePercentageDecimal,
		maximumDebtToIncomePercentage,
	});

	return {
		totalMonthlyIncome,
		totalMonthlyExpenses,
		currentDisposableIncome,
		projectedDisposableIncome,
		requiredMonthlyBuffer,
		availableAfterBuffer,
		proposedMonthlyCommitment,

		ratios: {
			housingCostPercentage,
			debtToIncomePercentage,
			essentialCostPercentage,
			totalExpensePercentage,
			disposableIncomePercentage,
		},

		rating,

		isAffordable: rating === "comfortable" || rating === "manageable",

		reasons,
	};
}

export function calculateMaximumAffordableCommitment(input: {
	monthlyIncome: Money;
	monthlyExpenses: Money;
	requiredMonthlyBuffer?: Money;
}): Money {
	const requiredMonthlyBuffer =
		input.requiredMonthlyBuffer ?? DEFAULT_REQUIRED_BUFFER;

	const available = input.monthlyIncome
		.subtract(input.monthlyExpenses)
		.subtract(requiredMonthlyBuffer);

	return available.isNegative() ? Money.zero() : available;
}

export function calculateDebtToIncomeRatio(input: {
	monthlyDebtPayments: Money;
	monthlyIncome: Money;
}): Decimal {
	if (input.monthlyIncome.isZero()) {
		return new Decimal(0);
	}

	return input.monthlyDebtPayments
		.toDecimal()
		.div(input.monthlyIncome.toDecimal())
		.mul(100)
		.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function calculateCommitmentFromPercentage(input: {
	monthlyIncome: Money;
	percentage: Decimal.Value;
}): Money {
	const rate = percentageToRate(input.percentage);

	return Money.from(input.monthlyIncome.toDecimal().mul(rate));
}
