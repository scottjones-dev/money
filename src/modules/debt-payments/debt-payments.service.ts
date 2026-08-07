import Decimal from "decimal.js";
import type { DebtPayment } from "@/db/schema";
import { decryptString, encryptString } from "@/lib/encryption";
import { debtsRepository } from "@/modules/debts/debts.repository";
import { membersRepository } from "@/modules/members/members.repository";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import type { HouseholdRole } from "@/types/app";
import { debtPaymentsRepository } from "./debt-payments.repository";
import type {
	CreateDebtPaymentInput,
	ListDebtPaymentsQuery,
	UpdateDebtPaymentInput,
} from "./debt-payments.schemas";

const money = (v: Decimal.Value) => new Decimal(v).toFixed(2);
const manage = (r: HouseholdRole) => {
	if (r === "viewer")
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message: "You do not have permission to change debt payments.",
			statusCode: 403,
		});
};
const map = (p: DebtPayment) => ({
	...p,
	reference:
		p.reference && p.referenceKeyId
			? decryptString({ keyId: p.referenceKeyId, value: p.reference })
			: p.reference,
	createdAt: p.createdAt.toISOString(),
	updatedAt: p.updatedAt.toISOString(),
});
const requiredDebt = async (householdId: string, debtId: string) => {
	const d = await debtsRepository.findById({ householdId, debtId });
	if (!d)
		throw new AppError({
			code: ERROR_CODES.DEBT_NOT_FOUND,
			message: "The debt could not be found.",
			statusCode: 404,
		});
	return d;
};
const required = async (
	householdId: string,
	debtId: string,
	paymentId: string,
) => {
	const p = await debtPaymentsRepository.find({
		householdId,
		debtId,
		paymentId,
	});
	if (!p)
		throw new AppError({
			code: ERROR_CODES.DEBT_PAYMENT_NOT_FOUND,
			message: "The debt payment could not be found.",
			statusCode: 404,
		});
	return p;
};
const encryptedReference = (reference: string | null | undefined) => {
	if (reference === undefined) return {};
	if (reference === null) return { reference: null, referenceKeyId: null };
	const encrypted = encryptString(reference);
	return { reference: encrypted.value, referenceKeyId: encrypted.keyId };
};
export const debtPaymentsService = {
	async create(i: {
		householdId: string;
		debtId: string;
		role: HouseholdRole;
		data: CreateDebtPaymentInput;
	}) {
		manage(i.role);
		const debt = await requiredDebt(i.householdId, i.debtId);
		if (i.data.idempotencyKey) {
			const existing = await debtPaymentsRepository.findIdempotent({
				householdId: i.householdId,
				idempotencyKey: i.data.idempotencyKey,
			});
			if (existing) return map(existing);
		}
		if (
			i.data.memberId &&
			!(await membersRepository.findById({
				householdId: i.householdId,
				memberId: i.data.memberId,
			}))
		)
			throw new AppError({
				code: ERROR_CODES.HOUSEHOLD_MEMBER_NOT_FOUND,
				message: "The member could not be found.",
				statusCode: 404,
			});
		const amount = new Decimal(i.data.amount);
		const before = new Decimal(i.data.balanceBefore ?? debt.currentBalance);
		const computed =
			i.data.status === "completed"
				? i.data.type === "refund"
					? before.plus(amount)
					: Decimal.max(0, before.minus(amount))
				: before;
		const after = i.data.balanceAfter
			? new Decimal(i.data.balanceAfter)
			: computed;
		const payment = await debtPaymentsRepository.create(
			{
				householdId: i.householdId,
				debtId: i.debtId,
				memberId: i.data.memberId ?? null,
				type: i.data.type,
				status: i.data.status,
				method: i.data.method ?? null,
				amount: money(amount),
				paymentDate: i.data.paymentDate,
				balanceBefore: money(before),
				balanceAfter: money(after),
				...encryptedReference(i.data.reference),
				idempotencyKey: i.data.idempotencyKey ?? null,
				notes: i.data.notes ?? null,
			},
			i.data.status === "completed" ? money(after) : undefined,
		);
		return map(payment);
	},
	async list(i: {
		householdId: string;
		debtId: string;
		query: ListDebtPaymentsQuery;
	}) {
		await requiredDebt(i.householdId, i.debtId);
		const f = {
			householdId: i.householdId,
			debtId: i.debtId,
			status: i.query.status,
			from: i.query.from,
			to: i.query.to,
		};
		const [items, totalItems] = await Promise.all([
			debtPaymentsRepository.list({
				...f,
				limit: i.query.pageSize,
				offset: getPaginationOffset(i.query),
			}),
			debtPaymentsRepository.count(f),
		]);
		return {
			data: items.map(map),
			pagination: createPaginationMeta({ ...i.query, totalItems }),
		};
	},
	async get(i: { householdId: string; debtId: string; paymentId: string }) {
		return map(await required(i.householdId, i.debtId, i.paymentId));
	},
	async update(i: {
		householdId: string;
		debtId: string;
		paymentId: string;
		role: HouseholdRole;
		data: UpdateDebtPaymentInput;
	}) {
		manage(i.role);
		const existing = await required(i.householdId, i.debtId, i.paymentId);
		if (
			existing.status === "completed" &&
			["amount", "status", "type", "balanceBefore", "balanceAfter"].some(
				(key) => key in i.data,
			)
		)
			throw new AppError({
				code: ERROR_CODES.CONFLICT,
				message:
					"Financial fields on a completed payment are immutable; delete and recreate the payment.",
				statusCode: 409,
			});
		const updated = await debtPaymentsRepository.update({
			householdId: i.householdId,
			debtId: i.debtId,
			paymentId: i.paymentId,
			values: {
				...i.data,
				...(i.data.amount ? { amount: money(i.data.amount) } : {}),
				...encryptedReference(i.data.reference),
			},
		});
		if (!updated) throw new Error("Debt payment update failed.");
		return map(updated);
	},
	async delete(i: {
		householdId: string;
		debtId: string;
		paymentId: string;
		role: HouseholdRole;
	}) {
		manage(i.role);
		const existing = await required(i.householdId, i.debtId, i.paymentId);
		if (existing.status === "completed")
			throw new AppError({
				code: ERROR_CODES.CONFLICT,
				message:
					"Completed payments cannot be deleted because they changed the recorded debt balance.",
				statusCode: 409,
			});
		await debtPaymentsRepository.delete(i);
		return { success: true as const, deletedId: i.paymentId };
	},
};
