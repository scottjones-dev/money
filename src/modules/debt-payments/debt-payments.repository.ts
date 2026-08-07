import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import {
	type DebtPayment,
	debtPayments,
	debts,
	type NewDebtPayment,
} from "@/db/schema";
import { db } from "@/lib/database";

const filters = (i: {
	householdId: string;
	debtId: string;
	status?: DebtPayment["status"];
	from?: string;
	to?: string;
}): SQL[] => {
	const c: SQL[] = [
		eq(debtPayments.householdId, i.householdId),
		eq(debtPayments.debtId, i.debtId),
	];
	if (i.status) c.push(eq(debtPayments.status, i.status));
	if (i.from) c.push(gte(debtPayments.paymentDate, i.from));
	if (i.to) c.push(lte(debtPayments.paymentDate, i.to));
	return c;
};
export const debtPaymentsRepository = {
	async find(i: { householdId: string; debtId: string; paymentId: string }) {
		const [v] = await db
			.select()
			.from(debtPayments)
			.where(
				and(
					eq(debtPayments.householdId, i.householdId),
					eq(debtPayments.debtId, i.debtId),
					eq(debtPayments.id, i.paymentId),
				),
			)
			.limit(1);
		return v ?? null;
	},
	async findIdempotent(i: { householdId: string; idempotencyKey: string }) {
		const [v] = await db
			.select()
			.from(debtPayments)
			.where(
				and(
					eq(debtPayments.householdId, i.householdId),
					eq(debtPayments.idempotencyKey, i.idempotencyKey),
				),
			)
			.limit(1);
		return v ?? null;
	},
	async list(i: {
		householdId: string;
		debtId: string;
		status?: DebtPayment["status"];
		from?: string;
		to?: string;
		limit: number;
		offset: number;
	}) {
		return db
			.select()
			.from(debtPayments)
			.where(and(...filters(i)))
			.orderBy(desc(debtPayments.paymentDate), desc(debtPayments.id))
			.limit(i.limit)
			.offset(i.offset);
	},
	async count(i: {
		householdId: string;
		debtId: string;
		status?: DebtPayment["status"];
		from?: string;
		to?: string;
	}) {
		const [v] = await db
			.select({ total: count() })
			.from(debtPayments)
			.where(and(...filters(i)));
		return v?.total ?? 0;
	},
	async create(values: NewDebtPayment, balanceAfter?: string) {
		return db.transaction(async (tx) => {
			const [v] = await tx.insert(debtPayments).values(values).returning();
			if (!v) throw new Error("Debt payment insertion failed.");
			if (balanceAfter !== undefined)
				await tx
					.update(debts)
					.set({ currentBalance: balanceAfter, updatedAt: new Date() })
					.where(
						and(
							eq(debts.householdId, values.householdId),
							eq(debts.id, values.debtId),
						),
					);
			return v;
		});
	},
	async update(i: {
		householdId: string;
		debtId: string;
		paymentId: string;
		values: Partial<NewDebtPayment>;
	}) {
		const [v] = await db
			.update(debtPayments)
			.set({ ...i.values, updatedAt: new Date() })
			.where(
				and(
					eq(debtPayments.householdId, i.householdId),
					eq(debtPayments.debtId, i.debtId),
					eq(debtPayments.id, i.paymentId),
				),
			)
			.returning();
		return v ?? null;
	},
	async delete(i: { householdId: string; debtId: string; paymentId: string }) {
		return (
			(
				await db
					.delete(debtPayments)
					.where(
						and(
							eq(debtPayments.householdId, i.householdId),
							eq(debtPayments.debtId, i.debtId),
							eq(debtPayments.id, i.paymentId),
						),
					)
					.returning({ id: debtPayments.id })
			).length > 0
		);
	},
};
