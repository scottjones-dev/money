// src/modules/income-sources/income-sources.repository.ts
import { and, count, desc, eq, type SQL } from "drizzle-orm";

import {
	householdMembers,
	type IncomeSource,
	incomeSources,
	type NewIncomeSource,
} from "@/db/schema";
import { db } from "@/lib/database";

export interface IncomeSourceListFilters {
	householdId: string;
	memberId?: string;
	type?: IncomeSource["type"];
	isActive?: boolean;
	limit: number;
	offset: number;
}

export interface IncomeSourceUpdateValues {
	memberId?: string;
	type?: IncomeSource["type"];
	name?: string;
	grossAmount?: string;
	frequency?: IncomeSource["frequency"];
	isTaxable?: boolean;
	isActive?: boolean;
	startDate?: string | null;
	endDate?: string | null;
	notes?: string | null;
	updatedAt?: Date;
}

function createIncomeSourceConditions(
	input: Omit<IncomeSourceListFilters, "limit" | "offset">,
): SQL[] {
	const conditions: SQL[] = [eq(incomeSources.householdId, input.householdId)];

	if (input.memberId) {
		conditions.push(eq(incomeSources.memberId, input.memberId));
	}

	if (input.type) {
		conditions.push(eq(incomeSources.type, input.type));
	}

	if (input.isActive !== undefined) {
		conditions.push(eq(incomeSources.isActive, input.isActive));
	}

	return conditions;
}

export const incomeSourcesRepository = {
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

	async findById(input: { householdId: string; incomeSourceId: string }) {
		const [incomeSource] = await db
			.select()
			.from(incomeSources)
			.where(
				and(
					eq(incomeSources.id, input.incomeSourceId),
					eq(incomeSources.householdId, input.householdId),
				),
			)
			.limit(1);

		return incomeSource ?? null;
	},

	async list(input: IncomeSourceListFilters): Promise<IncomeSource[]> {
		const conditions = createIncomeSourceConditions(input);

		return db
			.select()
			.from(incomeSources)
			.where(and(...conditions))
			.orderBy(desc(incomeSources.createdAt), desc(incomeSources.id))
			.limit(input.limit)
			.offset(input.offset);
	},

	async count(
		input: Omit<IncomeSourceListFilters, "limit" | "offset">,
	): Promise<number> {
		const conditions = createIncomeSourceConditions(input);

		const [result] = await db
			.select({
				total: count(),
			})
			.from(incomeSources)
			.where(and(...conditions));

		return result?.total ?? 0;
	},

	async create(values: NewIncomeSource): Promise<IncomeSource> {
		const [created] = await db.insert(incomeSources).values(values).returning();

		if (!created) {
			throw new Error("Income source was not returned after insertion.");
		}

		return created;
	},

	async update(input: {
		householdId: string;
		incomeSourceId: string;
		values: IncomeSourceUpdateValues;
	}): Promise<IncomeSource | null> {
		const [updated] = await db
			.update(incomeSources)
			.set({
				...input.values,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(incomeSources.id, input.incomeSourceId),
					eq(incomeSources.householdId, input.householdId),
				),
			)
			.returning();

		return updated ?? null;
	},

	async delete(input: {
		householdId: string;
		incomeSourceId: string;
	}): Promise<boolean> {
		const deleted = await db
			.delete(incomeSources)
			.where(
				and(
					eq(incomeSources.id, input.incomeSourceId),
					eq(incomeSources.householdId, input.householdId),
				),
			)
			.returning({
				id: incomeSources.id,
			});

		return deleted.length > 0;
	},
};
