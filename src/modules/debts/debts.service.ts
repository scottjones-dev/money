import Decimal from "decimal.js";

import type { Debt } from "@/db/schema";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import type { HouseholdRole } from "@/types/app";

import { debtsRepository } from "./debts.repository";
import type {
	CreateDebtInput,
	DebtResponse,
	ListDebtsQuery,
	UpdateDebtInput,
} from "./debts.schemas";

type PaymentFrequency = NonNullable<Debt["paymentFrequency"]>;

const PAYMENTS_PER_YEAR: Record<PaymentFrequency, Decimal> = {
	weekly: new Decimal(52),
	fortnightly: new Decimal(26),
	four_weekly: new Decimal(13),
	monthly: new Decimal(12),
	quarterly: new Decimal(4),
	half_yearly: new Decimal(2),
	yearly: new Decimal(1),
};

const MONEY_FIELDS = [
	"currentBalance",
	"originalBalance",
	"creditLimit",
	"minimumPayment",
	"plannedPayment",
] as const;

function assertCanManageDebts(role: HouseholdRole): void {
	if (role === "viewer") {
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message: "You do not have permission to change household debts.",
			statusCode: 403,
		});
	}
}

function assertValidMoney(value: string, field: string): void {
	const parsed = new Decimal(value);

	if (!parsed.isFinite() || parsed.isNegative()) {
		throw new AppError({
			code: ERROR_CODES.INVALID_MONEY_AMOUNT,
			message: "Debt amounts must be zero or greater.",
			statusCode: 422,
			details: [
				{
					field,
					message: "Amount cannot be negative.",
				},
			],
		});
	}
}

function assertValidPercentage(value: string | null | undefined): void {
	if (value == null) {
		return;
	}

	const parsed = new Decimal(value);

	if (!parsed.isFinite() || parsed.isNegative() || parsed.greaterThan(100)) {
		throw new AppError({
			code: ERROR_CODES.INVALID_PERCENTAGE,
			message: "Annual interest rate must be between 0 and 100.",
			statusCode: 422,
			details: [
				{
					field: "annualInterestRate",
					message: "Annual interest rate must be between 0 and 100.",
				},
			],
		});
	}
}

function assertValidDateRange(input: {
	startDate?: string | null;
	expectedEndDate?: string | null;
	settledAt?: string | null;
}): void {
	if (
		input.startDate &&
		input.expectedEndDate &&
		input.expectedEndDate < input.startDate
	) {
		throw new AppError({
			code: ERROR_CODES.INVALID_DATE_RANGE,
			message: "The expected end date cannot be before the start date.",
			statusCode: 422,
			details: [
				{
					field: "expectedEndDate",
					message: "Expected end date must be on or after the start date.",
				},
			],
		});
	}

	if (input.startDate && input.settledAt && input.settledAt < input.startDate) {
		throw new AppError({
			code: ERROR_CODES.INVALID_DATE_RANGE,
			message: "The settled date cannot be before the start date.",
			statusCode: 422,
			details: [
				{
					field: "settledAt",
					message: "Settled date must be on or after the start date.",
				},
			],
		});
	}
}

function formatMoney(value: Decimal): string {
	return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function normaliseMoney(value: string): string {
	return new Decimal(value).toFixed(2);
}

function normalisePercentage(value: string | null | undefined): string | null {
	return value == null ? null : new Decimal(value).toFixed(4);
}

function normalisePaymentDueDay(value?: number | null): string | null {
	return value == null ? null : String(value);
}

function paymentDueDayToNumber(value: string | null): number | null {
	return value === null ? null : Number(value);
}

function normalisePayment(debt: Debt): DebtResponse["normalisedPayment"] {
	const payment = debt.plannedPayment ?? debt.minimumPayment;

	if (!payment || !debt.paymentFrequency) {
		return null;
	}

	const yearly = new Decimal(payment).mul(PAYMENTS_PER_YEAR[debt.paymentFrequency]);

	return {
		weekly: formatMoney(yearly.div(52)),
		monthly: formatMoney(yearly.div(12)),
		yearly: formatMoney(yearly),
	};
}

function toDebtResponse(debt: Debt): DebtResponse {
	return {
		id: debt.id,
		householdId: debt.householdId,
		memberId: debt.memberId,
		type: debt.type,
		status: debt.status,
		priority: debt.priority,
		repaymentStrategy: debt.repaymentStrategy,
		name: debt.name,
		creditorName: debt.creditorName,
		currentBalance: debt.currentBalance,
		originalBalance: debt.originalBalance,
		creditLimit: debt.creditLimit,
		minimumPayment: debt.minimumPayment,
		paymentFrequency: debt.paymentFrequency,
		plannedPayment: debt.plannedPayment,
		interestType: debt.interestType,
		annualInterestRate: debt.annualInterestRate,
		paymentDueDay: paymentDueDayToNumber(debt.paymentDueDay),
		startDate: debt.startDate,
		expectedEndDate: debt.expectedEndDate,
		settledAt: debt.settledAt,
		includeInSnowball: debt.includeInSnowball,
		isSecured: debt.isSecured,
		isJoint: debt.isJoint,
		notes: debt.notes,
		normalisedPayment: normalisePayment(debt),
		createdAt: debt.createdAt.toISOString(),
		updatedAt: debt.updatedAt.toISOString(),
	};
}

async function assertMemberBelongsToHousehold(input: {
	householdId: string;
	memberId: string;
}): Promise<void> {
	const member = await debtsRepository.findMember(input);

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

async function getRequiredDebt(input: {
	householdId: string;
	debtId: string;
}): Promise<Debt> {
	const debt = await debtsRepository.findById(input);

	if (!debt) {
		throw new AppError({
			code: ERROR_CODES.DEBT_NOT_FOUND,
			message: "The debt could not be found.",
			statusCode: 404,
		});
	}

	return debt;
}

function validateCreateValues(values: CreateDebtInput): void {
	for (const field of MONEY_FIELDS) {
		const value = values[field];

		if (value != null) {
			assertValidMoney(value, field);
		}
	}

	assertValidPercentage(values.annualInterestRate);
	assertValidDateRange(values);
}

function validateUpdateValues(values: UpdateDebtInput): void {
	for (const field of MONEY_FIELDS) {
		const value = values[field];

		if (value != null) {
			assertValidMoney(value, field);
		}
	}

	assertValidPercentage(values.annualInterestRate);
}

function normaliseMoneyField(value: string | null | undefined): string | null {
	return value == null ? null : normaliseMoney(value);
}

export const debtsService = {
	async create(input: {
		householdId: string;
		role: HouseholdRole;
		values: CreateDebtInput;
	}): Promise<DebtResponse> {
		assertCanManageDebts(input.role);
		validateCreateValues(input.values);

		if (input.values.memberId) {
			await assertMemberBelongsToHousehold({
				householdId: input.householdId,
				memberId: input.values.memberId,
			});
		}

		const debt = await debtsRepository.create({
			householdId: input.householdId,
			memberId: input.values.memberId ?? null,
			type: input.values.type,
			status: input.values.status,
			priority: input.values.priority,
			repaymentStrategy: input.values.repaymentStrategy,
			name: input.values.name,
			creditorName: input.values.creditorName ?? null,
			currentBalance: normaliseMoney(input.values.currentBalance),
			originalBalance: normaliseMoneyField(input.values.originalBalance),
			creditLimit: normaliseMoneyField(input.values.creditLimit),
			minimumPayment: normaliseMoneyField(input.values.minimumPayment),
			paymentFrequency: input.values.paymentFrequency ?? null,
			plannedPayment: normaliseMoneyField(input.values.plannedPayment),
			interestType: input.values.interestType,
			annualInterestRate: normalisePercentage(input.values.annualInterestRate),
			paymentDueDay: normalisePaymentDueDay(input.values.paymentDueDay),
			startDate: input.values.startDate ?? null,
			expectedEndDate: input.values.expectedEndDate ?? null,
			settledAt: input.values.settledAt ?? null,
			includeInSnowball: input.values.includeInSnowball,
			isSecured: input.values.isSecured,
			isJoint: input.values.isJoint,
			notes: input.values.notes ?? null,
		});

		return toDebtResponse(debt);
	},

	async list(input: { householdId: string; query: ListDebtsQuery }) {
		const offset = (input.query.page - 1) * input.query.pageSize;

		const filters = {
			householdId: input.householdId,
			memberId: input.query.memberId,
			type: input.query.type,
			status: input.query.status,
			priority: input.query.priority,
			includeInSnowball: input.query.includeInSnowball,
		};

		const [items, total] = await Promise.all([
			debtsRepository.list({
				...filters,
				limit: input.query.pageSize,
				offset,
			}),
			debtsRepository.count(filters),
		]);

		return {
			items: items.map(toDebtResponse),
			meta: {
				page: input.query.page,
				pageSize: input.query.pageSize,
				total,
				totalPages: total === 0 ? 0 : Math.ceil(total / input.query.pageSize),
			},
		};
	},

	async get(input: {
		householdId: string;
		debtId: string;
	}): Promise<DebtResponse> {
		const debt = await getRequiredDebt(input);

		return toDebtResponse(debt);
	},

	async update(input: {
		householdId: string;
		debtId: string;
		role: HouseholdRole;
		values: UpdateDebtInput;
	}): Promise<DebtResponse> {
		assertCanManageDebts(input.role);

		const existing = await getRequiredDebt(input);

		validateUpdateValues(input.values);

		const startDate =
			input.values.startDate !== undefined
				? input.values.startDate
				: existing.startDate;

		const expectedEndDate =
			input.values.expectedEndDate !== undefined
				? input.values.expectedEndDate
				: existing.expectedEndDate;

		const settledAt =
			input.values.settledAt !== undefined
				? input.values.settledAt
				: existing.settledAt;

		assertValidDateRange({
			startDate,
			expectedEndDate,
			settledAt,
		});

		if (input.values.memberId && input.values.memberId !== existing.memberId) {
			await assertMemberBelongsToHousehold({
				householdId: input.householdId,
				memberId: input.values.memberId,
			});
		}

		const updated = await debtsRepository.update({
			householdId: input.householdId,
			debtId: input.debtId,
			values: {
				memberId: input.values.memberId,
				type: input.values.type,
				status: input.values.status,
				priority: input.values.priority,
				repaymentStrategy: input.values.repaymentStrategy,
				name: input.values.name,
				creditorName: input.values.creditorName,
				paymentFrequency: input.values.paymentFrequency,
				interestType: input.values.interestType,
				startDate: input.values.startDate,
				expectedEndDate: input.values.expectedEndDate,
				settledAt: input.values.settledAt,
				includeInSnowball: input.values.includeInSnowball,
				isSecured: input.values.isSecured,
				isJoint: input.values.isJoint,
				notes: input.values.notes,
				...(input.values.currentBalance
					? {
							currentBalance: normaliseMoney(input.values.currentBalance),
						}
					: {}),
				...(input.values.originalBalance !== undefined
					? {
							originalBalance: normaliseMoneyField(input.values.originalBalance),
						}
					: {}),
				...(input.values.creditLimit !== undefined
					? {
							creditLimit: normaliseMoneyField(input.values.creditLimit),
						}
					: {}),
				...(input.values.minimumPayment !== undefined
					? {
							minimumPayment: normaliseMoneyField(input.values.minimumPayment),
						}
					: {}),
				...(input.values.plannedPayment !== undefined
					? {
							plannedPayment: normaliseMoneyField(input.values.plannedPayment),
						}
					: {}),
				...(input.values.annualInterestRate !== undefined
					? {
							annualInterestRate: normalisePercentage(
								input.values.annualInterestRate,
							),
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
				code: ERROR_CODES.DEBT_NOT_FOUND,
				message: "The debt could not be found.",
				statusCode: 404,
			});
		}

		return toDebtResponse(updated);
	},

	async delete(input: {
		householdId: string;
		debtId: string;
		role: HouseholdRole;
	}): Promise<{ success: true }> {
		assertCanManageDebts(input.role);

		await getRequiredDebt(input);

		const deleted = await debtsRepository.delete({
			householdId: input.householdId,
			debtId: input.debtId,
		});

		if (!deleted) {
			throw new AppError({
				code: ERROR_CODES.DEBT_NOT_FOUND,
				message: "The debt could not be found.",
				statusCode: 404,
			});
		}

		return {
			success: true as const,
		};
	},
};
