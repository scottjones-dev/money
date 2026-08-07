import { and, count, desc, eq, type SQL } from "drizzle-orm";

import { type Debt, debts, type NewDebt } from "@/db/schema";
import { db } from "@/lib/database";

export interface DebtListFilters {
	householdId: string;
	memberId?: string;
	type?: Debt["type"];
	status?: Debt["status"];
	priority?: Debt["priority"];
	includeInSnowball?: boolean;
	limit: number;
	offset: number;
}

export interface DebtUpdateValues {
	memberId?: string | null;
	type?: Debt["type"];
	status?: Debt["status"];
	priority?: Debt["priority"];
	repaymentStrategy?: Debt["repaymentStrategy"];
	name?: string;
	creditorName?: string | null;
	currentBalance?: string;
	originalBalance?: string | null;
	creditLimit?: string | null;
	minimumPayment?: string | null;
	paymentFrequency?: Debt["paymentFrequency"] | null;
	plannedPayment?: string | null;
	interestType?: Debt["interestType"];
	annualInterestRate?: string | null;
	paymentDueDay?: string | null;
	startDate?: string | null;
	expectedEndDate?: string | null;
	settledAt?: string | null;
	includeInSnowball?: boolean;
	isSecured?: boolean;
	isJoint?: boolean;
	notes?: string | null;
}

function createDebtConditions(
	input: Omit<DebtListFilters, "limit" | "offset">,
): SQL[] {
	const conditions: SQL[] = [eq(debts.householdId, input.householdId)];

	if (input.memberId) {
		conditions.push(eq(debts.memberId, input.memberId));
	}

	if (input.type) {
		conditions.push(eq(debts.type, input.type));
	}

	if (input.status) {
		conditions.push(eq(debts.status, input.status));
	}

	if (input.priority) {
		conditions.push(eq(debts.priority, input.priority));
	}

	if (input.includeInSnowball !== undefined) {
		conditions.push(eq(debts.includeInSnowball, input.includeInSnowball));
	}

	return conditions;
}

export const debtsRepository = {
	async findById(input: { householdId: string; debtId: string }) {
		const [debt] = await db
			.select()
			.from(debts)
			.where(
				and(
					eq(debts.id, input.debtId),
					eq(debts.householdId, input.householdId),
				),
			)
			.limit(1);

		return debt ?? null;
	},

	async list(input: DebtListFilters): Promise<Debt[]> {
		const conditions = createDebtConditions(input);

		return db
			.select()
			.from(debts)
			.where(and(...conditions))
			.orderBy(desc(debts.createdAt), desc(debts.id))
			.limit(input.limit)
			.offset(input.offset);
	},

	async count(
		input: Omit<DebtListFilters, "limit" | "offset">,
	): Promise<number> {
		const conditions = createDebtConditions(input);

		const [result] = await db
			.select({
				total: count(),
			})
			.from(debts)
			.where(and(...conditions));

		return result?.total ?? 0;
	},

	async create(values: NewDebt): Promise<Debt> {
		const [created] = await db.insert(debts).values(values).returning();

		if (!created) {
			throw new Error("Debt was not returned after insertion.");
		}

		return created;
	},

	async update(input: {
		householdId: string;
		debtId: string;
		values: DebtUpdateValues;
	}): Promise<Debt | null> {
		const [updated] = await db
			.update(debts)
			.set({
				...input.values,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(debts.id, input.debtId),
					eq(debts.householdId, input.householdId),
				),
			)
			.returning();

		return updated ?? null;
	},

	async delete(input: {
		householdId: string;
		debtId: string;
	}): Promise<boolean> {
		const deleted = await db
			.delete(debts)
			.where(
				and(
					eq(debts.id, input.debtId),
					eq(debts.householdId, input.householdId),
				),
			)
			.returning({
				id: debts.id,
			});

		return deleted.length > 0;
	},
};
