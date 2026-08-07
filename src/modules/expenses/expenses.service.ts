import Decimal from "decimal.js";

import type { Expense } from "@/db/schema";
import { membersRepository } from "@/modules/members/members.repository";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import { normaliseDecimalToYearly } from "@/shared/frequency/normalise-frequency";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import type { HouseholdRole } from "@/types/app";

import { expensesRepository } from "./expenses.repository";
import type {
	CreateExpenseInput,
	ExpenseResponse,
	ListExpensesQuery,
	UpdateExpenseInput,
} from "./expenses.schemas";

function assertCanManageExpenses(role: HouseholdRole): void {
	if (role === "viewer") {
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message: "You do not have permission to change household expenses.",
			statusCode: 403,
		});
	}
}

function assertValidAmount(amount: string): void {
	const parsed = new Decimal(amount);

	if (!parsed.isFinite() || parsed.isNegative()) {
		throw new AppError({
			code: ERROR_CODES.INVALID_MONEY_AMOUNT,
			message: "Expense amount must be zero or greater.",
			statusCode: 422,
			details: [
				{
					field: "amount",
					message: "Amount cannot be negative.",
				},
			],
		});
	}
}

function assertValidDateRange(input: {
	startDate?: string | null;
	endDate?: string | null;
}): void {
	if (input.startDate && input.endDate && input.endDate < input.startDate) {
		throw new AppError({
			code: ERROR_CODES.INVALID_DATE_RANGE,
			message: "The expense end date cannot be before its start date.",
			statusCode: 422,
			details: [
				{
					field: "endDate",
					message: "End date must be on or after the start date.",
				},
			],
		});
	}
}

function formatMoney(value: Decimal): string {
	return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function normaliseExpense(
	amount: string,
	frequency: Expense["frequency"],
): ExpenseResponse["normalised"] {
	if (frequency === "one_off") {
		return null;
	}

	const yearly = normaliseDecimalToYearly(amount, frequency);

	return {
		weekly: formatMoney(yearly.div(52)),
		monthly: formatMoney(yearly.div(12)),
		yearly: formatMoney(yearly),
	};
}

function paymentDueDayToNumber(value: string | null): number | null {
	return value === null ? null : Number(value);
}

function toExpenseResponse(expense: Expense): ExpenseResponse {
	return {
		id: expense.id,
		householdId: expense.householdId,
		memberId: expense.memberId,
		category: expense.category,
		priority: expense.priority,
		name: expense.name,
		amount: expense.amount,
		frequency: expense.frequency,
		paymentMethod: expense.paymentMethod,
		paymentDueDay: paymentDueDayToNumber(expense.paymentDueDay),
		startDate: expense.startDate,
		endDate: expense.endDate,
		isActive: expense.isActive,
		isFixed: expense.isFixed,
		isHouseholdExpense: expense.isHouseholdExpense,
		includeInBudget: expense.includeInBudget,
		payee: expense.payee,
		notes: expense.notes,
		normalised: normaliseExpense(expense.amount, expense.frequency),
		createdAt: expense.createdAt.toISOString(),
		updatedAt: expense.updatedAt.toISOString(),
	};
}

async function assertMemberBelongsToHousehold(input: {
	householdId: string;
	memberId: string;
}): Promise<void> {
	const member = await membersRepository.findById(input);

	if (!member) {
		throw new AppError({
			code: ERROR_CODES.HOUSEHOLD_MEMBER_NOT_FOUND,
			message: "The selected household member could not be found.",
			statusCode: 404,
			details: [
				{
					field: "memberId",
					message: "The member does not belong to this household.",
				},
			],
		});
	}
}

async function getRequiredExpense(input: {
	householdId: string;
	expenseId: string;
}): Promise<Expense> {
	const expense = await expensesRepository.findById(input);

	if (!expense) {
		throw new AppError({
			code: ERROR_CODES.EXPENSE_NOT_FOUND,
			message: "The expense could not be found.",
			statusCode: 404,
		});
	}

	return expense;
}

function normaliseAmount(amount: string): string {
	return new Decimal(amount).toFixed(2);
}

function normalisePaymentDueDay(value?: number | null): string | null {
	return value == null ? null : String(value);
}

export const expensesService = {
	async create(input: {
		householdId: string;
		role: HouseholdRole;
		values: CreateExpenseInput;
	}): Promise<ExpenseResponse> {
		assertCanManageExpenses(input.role);
		assertValidAmount(input.values.amount);
		assertValidDateRange(input.values);

		if (input.values.memberId) {
			await assertMemberBelongsToHousehold({
				householdId: input.householdId,
				memberId: input.values.memberId,
			});
		}

		const expense = await expensesRepository.create({
			householdId: input.householdId,
			memberId: input.values.memberId ?? null,
			category: input.values.category,
			priority: input.values.priority,
			name: input.values.name,
			amount: normaliseAmount(input.values.amount),
			frequency: input.values.frequency,
			paymentMethod: input.values.paymentMethod ?? null,
			paymentDueDay: normalisePaymentDueDay(input.values.paymentDueDay),
			startDate: input.values.startDate ?? null,
			endDate: input.values.endDate ?? null,
			isActive: input.values.isActive,
			isFixed: input.values.isFixed,
			isHouseholdExpense: input.values.isHouseholdExpense,
			includeInBudget: input.values.includeInBudget,
			payee: input.values.payee ?? null,
			notes: input.values.notes ?? null,
		});

		return toExpenseResponse(expense);
	},

	async list(input: { householdId: string; query: ListExpensesQuery }) {
		const offset = getPaginationOffset(input.query);

		const filters = {
			householdId: input.householdId,
			memberId: input.query.memberId,
			category: input.query.category,
			priority: input.query.priority,
			isActive: input.query.isActive,
			includeInBudget: input.query.includeInBudget,
		};

		const [items, total] = await Promise.all([
			expensesRepository.list({
				...filters,
				limit: input.query.pageSize,
				offset,
			}),
			expensesRepository.count(filters),
		]);

		return {
			data: items.map(toExpenseResponse),
			pagination: createPaginationMeta({
				...input.query,
				totalItems: total,
			}),
		};
	},

	async get(input: {
		householdId: string;
		expenseId: string;
	}): Promise<ExpenseResponse> {
		const expense = await getRequiredExpense(input);

		return toExpenseResponse(expense);
	},

	async update(input: {
		householdId: string;
		expenseId: string;
		role: HouseholdRole;
		values: UpdateExpenseInput;
	}): Promise<ExpenseResponse> {
		assertCanManageExpenses(input.role);

		const existing = await getRequiredExpense(input);

		if (input.values.amount !== undefined) {
			assertValidAmount(input.values.amount);
		}

		const startDate =
			input.values.startDate !== undefined
				? input.values.startDate
				: existing.startDate;

		const endDate =
			input.values.endDate !== undefined
				? input.values.endDate
				: existing.endDate;

		assertValidDateRange({
			startDate,
			endDate,
		});

		if (input.values.memberId && input.values.memberId !== existing.memberId) {
			await assertMemberBelongsToHousehold({
				householdId: input.householdId,
				memberId: input.values.memberId,
			});
		}

		const updated = await expensesRepository.update({
			householdId: input.householdId,
			expenseId: input.expenseId,
			values: {
				memberId: input.values.memberId,
				category: input.values.category,
				priority: input.values.priority,
				name: input.values.name,
				frequency: input.values.frequency,
				paymentMethod: input.values.paymentMethod,
				startDate: input.values.startDate,
				endDate: input.values.endDate,
				isActive: input.values.isActive,
				isFixed: input.values.isFixed,
				isHouseholdExpense: input.values.isHouseholdExpense,
				includeInBudget: input.values.includeInBudget,
				payee: input.values.payee,
				notes: input.values.notes,
				...(input.values.amount
					? {
							amount: normaliseAmount(input.values.amount),
						}
					: {}),
				...(input.values.paymentDueDay !== undefined
					? {
							paymentDueDay: normalisePaymentDueDay(input.values.paymentDueDay),
						}
					: {}),
			},
		});

		if (!updated) {
			throw new AppError({
				code: ERROR_CODES.EXPENSE_NOT_FOUND,
				message: "The expense could not be found.",
				statusCode: 404,
			});
		}

		return toExpenseResponse(updated);
	},

	async delete(input: {
		householdId: string;
		expenseId: string;
		role: HouseholdRole;
	}): Promise<{ success: true }> {
		assertCanManageExpenses(input.role);

		await getRequiredExpense(input);

		const deleted = await expensesRepository.delete({
			householdId: input.householdId,
			expenseId: input.expenseId,
		});

		if (!deleted) {
			throw new AppError({
				code: ERROR_CODES.EXPENSE_NOT_FOUND,
				message: "The expense could not be found.",
				statusCode: 404,
			});
		}

		return {
			success: true as const,
		};
	},
};
