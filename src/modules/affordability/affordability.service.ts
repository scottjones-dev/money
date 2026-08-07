// src/modules/affordability/affordability.service.ts
import type { Debt, Expense, IncomeSource } from "@/db/schema";
import { normaliseAmountToMonthly } from "@/shared/frequency/normalise-frequency";
import { Money } from "@/shared/money/money";
import { affordabilityRepository } from "./affordability.repository";
import type {
	AffordabilityResponse,
	CalculateAffordabilityInput,
} from "./affordability.schemas";
import {
	type AffordabilityExpenseInput,
	type AffordabilityIncomeInput,
	calculateAffordability,
} from "./domain";

const BENEFIT_INCOME_TYPES = new Set<IncomeSource["type"]>(["benefit"]);

const OTHER_INCOME_TYPES = new Set<IncomeSource["type"]>([
	"maintenance",
	"rental",
	"investment",
	"other",
]);

const HOUSING_EXPENSE_CATEGORIES = new Set<Expense["category"]>([
	"housing",
	"council_tax",
	"utilities",
]);

function normaliseToMonthly(
	amount: string,
	frequency: IncomeSource["frequency"],
): Money {
	if (frequency === "one_off") {
		return Money.zero();
	}

	return normaliseAmountToMonthly(amount, frequency);
}

function sumMoney(values: Money[]): Money {
	return values.reduce((total, value) => total.add(value), Money.zero());
}

function calculateIncomeTotals(
	incomeSources: IncomeSource[],
): AffordabilityIncomeInput {
	const monthlyIncome = incomeSources.map((source) => ({
		source,
		monthly: normaliseToMonthly(source.grossAmount, source.frequency),
	}));

	const benefitIncome = sumMoney(
		monthlyIncome
			.filter(({ source }) => BENEFIT_INCOME_TYPES.has(source.type))
			.map(({ monthly }) => monthly),
	);

	const otherIncome = sumMoney(
		monthlyIncome
			.filter(({ source }) => OTHER_INCOME_TYPES.has(source.type))
			.map(({ monthly }) => monthly),
	);

	const earnedAndPensionIncome = sumMoney(
		monthlyIncome
			.filter(
				({ source }) =>
					!BENEFIT_INCOME_TYPES.has(source.type) &&
					!OTHER_INCOME_TYPES.has(source.type),
			)
			.map(({ monthly }) => monthly),
	);

	/*
	 * Income sources currently store gross amounts only.
	 *
	 * Until payroll, tax and NI calculations are connected, use the recorded
	 * amount as the current estimated net amount. Replace this mapping when
	 * employment calculations produce actual take-home pay.
	 */
	return {
		grossMonthlyIncome: earnedAndPensionIncome,
		netMonthlyIncome: earnedAndPensionIncome,
		benefitIncome,
		otherIncome,
	};
}

function calculateExpenseTotals(
	expenseRows: Expense[],
	debtRows: Debt[],
): AffordabilityExpenseInput {
	const monthlyExpenses = expenseRows.map((expense) => ({
		expense,
		monthly: normaliseToMonthly(expense.amount, expense.frequency),
	}));

	const essentialExpenses = sumMoney(
		monthlyExpenses
			.filter(({ expense }) => expense.priority === "essential")
			.map(({ monthly }) => monthly),
	);

	const importantExpenses = sumMoney(
		monthlyExpenses
			.filter(({ expense }) => expense.priority === "important")
			.map(({ monthly }) => monthly),
	);

	const discretionaryExpenses = sumMoney(
		monthlyExpenses
			.filter(({ expense }) => expense.priority === "discretionary")
			.map(({ monthly }) => monthly),
	);

	const housingCosts = sumMoney(
		monthlyExpenses
			.filter(({ expense }) => HOUSING_EXPENSE_CATEGORIES.has(expense.category))
			.map(({ monthly }) => monthly),
	);

	const debtPayments = sumMoney(
		debtRows.map((debt) => {
			const payment = debt.plannedPayment ?? debt.minimumPayment ?? "0.00";

			if (!debt.paymentFrequency) {
				return Money.from(payment);
			}

			return normaliseToMonthly(payment, debt.paymentFrequency);
		}),
	);

	return {
		essentialExpenses,
		importantExpenses,
		discretionaryExpenses,
		debtPayments,
		housingCosts,
	};
}

function moneyToString(value: Money): string {
	return value.toString();
}

export const affordabilityService = {
	async calculate(input: {
		householdId: string;
		values: CalculateAffordabilityInput;
	}): Promise<AffordabilityResponse> {
		const [incomeRows, expenseRows, debtRows] = await Promise.all([
			affordabilityRepository.listActiveIncomeSources(input.householdId),
			affordabilityRepository.listActiveExpenses(input.householdId),
			affordabilityRepository.listActiveDebts(input.householdId),
		]);

		const income = calculateIncomeTotals(incomeRows);

		const expenses = calculateExpenseTotals(expenseRows, debtRows);

		const result = calculateAffordability({
			income,
			expenses,
			proposedMonthlyCommitment: Money.from(
				input.values.proposedMonthlyCommitment,
			),
			requiredMonthlyBuffer: Money.from(input.values.requiredMonthlyBuffer),
			maximumDebtToIncomePercentage: input.values.maximumDebtToIncomePercentage,
		});

		return {
			householdId: input.householdId,

			rating: result.rating,

			isAffordable: result.isAffordable,

			totals: {
				netMonthlyIncome: moneyToString(income.netMonthlyIncome),
				benefitIncome: moneyToString(income.benefitIncome),
				otherIncome: moneyToString(income.otherIncome),
				totalMonthlyIncome: moneyToString(result.totalMonthlyIncome),

				essentialExpenses: moneyToString(expenses.essentialExpenses),
				importantExpenses: moneyToString(expenses.importantExpenses),
				discretionaryExpenses: moneyToString(expenses.discretionaryExpenses),
				debtPayments: moneyToString(expenses.debtPayments),
				housingCosts: moneyToString(expenses.housingCosts),
				totalMonthlyExpenses: moneyToString(result.totalMonthlyExpenses),

				currentDisposableIncome: moneyToString(result.currentDisposableIncome),
				projectedDisposableIncome: moneyToString(
					result.projectedDisposableIncome,
				),
				requiredMonthlyBuffer: moneyToString(result.requiredMonthlyBuffer),
				availableAfterBuffer: moneyToString(result.availableAfterBuffer),
				proposedMonthlyCommitment: moneyToString(
					result.proposedMonthlyCommitment,
				),
			},

			ratios: result.ratios,

			reasons: result.reasons,

			calculatedAt: new Date().toISOString(),
		};
	},
};
