import { and, count, desc, eq, type SQL } from "drizzle-orm";

import {
	type Expense,
	expenses,
	householdMembers,
	type NewExpense,
} from "@/db/schema";
import { db } from "@/lib/database";

export interface ExpenseListFilters {
	householdId: string;
	memberId?: string;
	category?: Expense["category"];
	priority?: Expense["priority"];
	isActive?: boolean;
	includeInBudget?: boolean;
	limit: number;
	offset: number;
}

export interface ExpenseUpdateValues {
	memberId?: string | null;
	category?: Expense["category"];
	priority?: Expense["priority"];
	name?: string;
	amount?: string;
	frequency?: Expense["frequency"];
	paymentMethod?: Expense["paymentMethod"] | null;
	paymentDueDay?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	isActive?: boolean;
	isFixed?: boolean;
	isHouseholdExpense?: boolean;
	includeInBudget?: boolean;
	payee?: string | null;
	notes?: string | null;
}

function createExpenseConditions(
	input: Omit<ExpenseListFilters, "limit" | "offset">,
): SQL[] {
	const conditions: SQL[] = [eq(expenses.householdId, input.householdId)];

	if (input.memberId) {
		conditions.push(eq(expenses.memberId, input.memberId));
	}

	if (input.category) {
		conditions.push(eq(expenses.category, input.category));
	}

	if (input.priority) {
		conditions.push(eq(expenses.priority, input.priority));
	}

	if (input.isActive !== undefined) {
		conditions.push(eq(expenses.isActive, input.isActive));
	}

	if (input.includeInBudget !== undefined) {
		conditions.push(eq(expenses.includeInBudget, input.includeInBudget));
	}

	return conditions;
}

export const expensesRepository = {
	async findMember(input: { householdId: string; memberId: string }) {
		const [member] = await db
			.select()
			.from(householdMembers)
			.where(
				and(
					eq(householdMembers.id, input.memberId),
					eq(householdMembers.householdId, input.householdId),
				),
			)
			.limit(1);

		return member ?? null;
	},

	async findById(input: { householdId: string; expenseId: string }) {
		const [expense] = await db
			.select()
			.from(expenses)
			.where(
				and(
					eq(expenses.id, input.expenseId),
					eq(expenses.householdId, input.householdId),
				),
			)
			.limit(1);

		return expense ?? null;
	},

	async list(input: ExpenseListFilters): Promise<Expense[]> {
		const conditions = createExpenseConditions(input);

		return db
			.select()
			.from(expenses)
			.where(and(...conditions))
			.orderBy(desc(expenses.createdAt), desc(expenses.id))
			.limit(input.limit)
			.offset(input.offset);
	},

	async count(
		input: Omit<ExpenseListFilters, "limit" | "offset">,
	): Promise<number> {
		const conditions = createExpenseConditions(input);

		const [result] = await db
			.select({
				total: count(),
			})
			.from(expenses)
			.where(and(...conditions));

		return result?.total ?? 0;
	},

	async create(values: NewExpense): Promise<Expense> {
		const [created] = await db.insert(expenses).values(values).returning();

		if (!created) {
			throw new Error("Expense was not returned after insertion.");
		}

		return created;
	},

	async update(input: {
		householdId: string;
		expenseId: string;
		values: ExpenseUpdateValues;
	}): Promise<Expense | null> {
		const [updated] = await db
			.update(expenses)
			.set({
				...input.values,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(expenses.id, input.expenseId),
					eq(expenses.householdId, input.householdId),
				),
			)
			.returning();

		return updated ?? null;
	},

	async delete(input: {
		householdId: string;
		expenseId: string;
	}): Promise<boolean> {
		const deleted = await db
			.delete(expenses)
			.where(
				and(
					eq(expenses.id, input.expenseId),
					eq(expenses.householdId, input.householdId),
				),
			)
			.returning({
				id: expenses.id,
			});

		return deleted.length > 0;
	},
};
