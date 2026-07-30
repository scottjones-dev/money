// src/modules/income-sources/income-sources.service.ts
import Decimal from "decimal.js";

import type { IncomeSource } from "@/db/schema";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import type { HouseholdRole } from "@/types/app";

import { incomeSourcesRepository } from "./income-sources.repository";
import type {
	CreateIncomeSourceInput,
	IncomeSourceResponse,
	ListIncomeSourcesQuery,
	UpdateIncomeSourceInput,
} from "./income-sources.schemas";

type RecurringFrequency = Exclude<IncomeSource["frequency"], "one_off">;

const PAYMENTS_PER_YEAR: Record<RecurringFrequency, Decimal> = {
	weekly: new Decimal(52),
	fortnightly: new Decimal(26),
	four_weekly: new Decimal(13),
	monthly: new Decimal(12),
	quarterly: new Decimal(4),
	half_yearly: new Decimal(2),
	yearly: new Decimal(1),
};

function assertCanManageIncomeSources(role: HouseholdRole): void {
	if (role === "viewer") {
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message: "You do not have permission to change household income sources.",
			statusCode: 403,
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
			message: "The income-source end date cannot be before its start date.",
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

function assertValidAmount(amount: string): void {
	const parsed = new Decimal(amount);

	if (!parsed.isFinite() || parsed.isNegative()) {
		throw new AppError({
			code: ERROR_CODES.INVALID_MONEY_AMOUNT,
			message: "Income amount must be zero or greater.",
			statusCode: 422,
			details: [
				{
					field: "grossAmount",
					message: "Gross amount cannot be negative.",
				},
			],
		});
	}
}

function formatMoney(value: Decimal): string {
	return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function normaliseIncome(
	amount: string,
	frequency: IncomeSource["frequency"],
): IncomeSourceResponse["normalised"] {
	if (frequency === "one_off") {
		return null;
	}

	const value = new Decimal(amount);
	const yearly = value.mul(PAYMENTS_PER_YEAR[frequency]);

	return {
		weekly: formatMoney(yearly.div(52)),
		monthly: formatMoney(yearly.div(12)),
		yearly: formatMoney(yearly),
	};
}

function toIncomeSourceResponse(
	incomeSource: IncomeSource,
): IncomeSourceResponse {
	return {
		id: incomeSource.id,
		householdId: incomeSource.householdId,
		memberId: incomeSource.memberId,
		type: incomeSource.type,
		name: incomeSource.name,
		grossAmount: incomeSource.grossAmount,
		frequency: incomeSource.frequency,
		isTaxable: incomeSource.isTaxable,
		isActive: incomeSource.isActive,
		startDate: incomeSource.startDate,
		endDate: incomeSource.endDate,
		notes: incomeSource.notes,
		normalised: normaliseIncome(
			incomeSource.grossAmount,
			incomeSource.frequency,
		),
		createdAt: incomeSource.createdAt.toISOString(),
		updatedAt: incomeSource.updatedAt.toISOString(),
	};
}

async function assertMemberBelongsToHousehold(input: {
	householdId: string;
	memberId: string;
}): Promise<void> {
	const member = await incomeSourcesRepository.findMember(input);

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

async function getRequiredIncomeSource(input: {
	householdId: string;
	incomeSourceId: string;
}): Promise<IncomeSource> {
	const incomeSource = await incomeSourcesRepository.findById(input);

	if (!incomeSource) {
		throw new AppError({
			code: ERROR_CODES.INCOME_SOURCE_NOT_FOUND,
			message: "The income source could not be found.",
			statusCode: 404,
		});
	}

	return incomeSource;
}

export const incomeSourcesService = {
	async create(input: {
		householdId: string;
		role: HouseholdRole;
		values: CreateIncomeSourceInput;
	}): Promise<IncomeSourceResponse> {
		assertCanManageIncomeSources(input.role);
		assertValidAmount(input.values.grossAmount);
		assertValidDateRange(input.values);

		await assertMemberBelongsToHousehold({
			householdId: input.householdId,
			memberId: input.values.memberId,
		});

		const incomeSource = await incomeSourcesRepository.create({
			householdId: input.householdId,
			memberId: input.values.memberId,
			type: input.values.type,
			name: input.values.name,
			grossAmount: new Decimal(input.values.grossAmount).toFixed(2),
			frequency: input.values.frequency,
			isTaxable: input.values.isTaxable,
			isActive: input.values.isActive,
			startDate: input.values.startDate ?? null,
			endDate: input.values.endDate ?? null,
			notes: input.values.notes ?? null,
		});

		return toIncomeSourceResponse(incomeSource);
	},

	async list(input: { householdId: string; query: ListIncomeSourcesQuery }) {
		const offset = (input.query.page - 1) * input.query.pageSize;

		const filters = {
			householdId: input.householdId,
			memberId: input.query.memberId,
			type: input.query.type,
			isActive: input.query.isActive,
		};

		const [items, total] = await Promise.all([
			incomeSourcesRepository.list({
				...filters,
				limit: input.query.pageSize,
				offset,
			}),
			incomeSourcesRepository.count(filters),
		]);

		return {
			items: items.map(toIncomeSourceResponse),

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
		incomeSourceId: string;
	}): Promise<IncomeSourceResponse> {
		const incomeSource = await getRequiredIncomeSource(input);

		return toIncomeSourceResponse(incomeSource);
	},

	async update(input: {
		householdId: string;
		incomeSourceId: string;
		role: HouseholdRole;
		values: UpdateIncomeSourceInput;
	}): Promise<IncomeSourceResponse> {
		assertCanManageIncomeSources(input.role);

		const existing = await getRequiredIncomeSource(input);

		if (input.values.grossAmount !== undefined) {
			assertValidAmount(input.values.grossAmount);
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

		const updated = await incomeSourcesRepository.update({
			householdId: input.householdId,
			incomeSourceId: input.incomeSourceId,

			values: {
				...input.values,

				...(input.values.grossAmount
					? {
							grossAmount: new Decimal(input.values.grossAmount).toFixed(2),
						}
					: {}),
			},
		});

		if (!updated) {
			throw new AppError({
				code: ERROR_CODES.INCOME_SOURCE_NOT_FOUND,
				message: "The income source could not be found.",
				statusCode: 404,
			});
		}

		return toIncomeSourceResponse(updated);
	},

	async delete(input: {
		householdId: string;
		incomeSourceId: string;
		role: HouseholdRole;
	}): Promise<{ success: true }> {
		assertCanManageIncomeSources(input.role);

		await getRequiredIncomeSource(input);

		const deleted = await incomeSourcesRepository.delete(input);

		if (!deleted) {
			throw new AppError({
				code: ERROR_CODES.INCOME_SOURCE_NOT_FOUND,
				message: "The income source could not be found.",
				statusCode: 404,
			});
		}

		return {
			success: true as const,
		};
	},
};
