import { and, count, desc, eq, type SQL } from "drizzle-orm";
import {
	type Employment,
	employments,
	type NewEmployment,
	type NewPension,
	type Pension,
	pensions,
} from "@/db/schema";
import { db } from "@/lib/database";

const employmentConditions = (i: {
	householdId: string;
	memberId?: string;
	isActive?: boolean;
}): SQL[] => {
	const c: SQL[] = [eq(employments.householdId, i.householdId)];
	if (i.memberId) c.push(eq(employments.memberId, i.memberId));
	if (i.isActive !== undefined) c.push(eq(employments.isActive, i.isActive));
	return c;
};
const pensionConditions = (i: {
	householdId: string;
	memberId?: string;
	isActive?: boolean;
}): SQL[] => {
	const c: SQL[] = [eq(pensions.householdId, i.householdId)];
	if (i.memberId) c.push(eq(pensions.memberId, i.memberId));
	if (i.isActive !== undefined) c.push(eq(pensions.isActive, i.isActive));
	return c;
};
export const profilesRepository = {
	async createEmployment(v: NewEmployment) {
		const [r] = await db.insert(employments).values(v).returning();
		if (!r) throw new Error("Employment insertion failed.");
		return r;
	},
	async findEmployment(householdId: string, id: string) {
		const [r] = await db
			.select()
			.from(employments)
			.where(
				and(eq(employments.householdId, householdId), eq(employments.id, id)),
			)
			.limit(1);
		return r ?? null;
	},
	async listEmployment(i: {
		householdId: string;
		memberId?: string;
		isActive?: boolean;
		limit: number;
		offset: number;
	}) {
		return db
			.select()
			.from(employments)
			.where(and(...employmentConditions(i)))
			.orderBy(desc(employments.createdAt), desc(employments.id))
			.limit(i.limit)
			.offset(i.offset);
	},
	async countEmployment(i: {
		householdId: string;
		memberId?: string;
		isActive?: boolean;
	}) {
		const [r] = await db
			.select({ total: count() })
			.from(employments)
			.where(and(...employmentConditions(i)));
		return r?.total ?? 0;
	},
	async updateEmployment(
		householdId: string,
		id: string,
		v: Partial<NewEmployment>,
	) {
		const [r] = await db
			.update(employments)
			.set({ ...v, updatedAt: new Date() })
			.where(
				and(eq(employments.householdId, householdId), eq(employments.id, id)),
			)
			.returning();
		return r ?? null;
	},
	async deleteEmployment(householdId: string, id: string) {
		return (
			(
				await db
					.delete(employments)
					.where(
						and(
							eq(employments.householdId, householdId),
							eq(employments.id, id),
						),
					)
					.returning({ id: employments.id })
			).length > 0
		);
	},
	async createPension(v: NewPension) {
		const [r] = await db.insert(pensions).values(v).returning();
		if (!r) throw new Error("Pension insertion failed.");
		return r;
	},
	async findPension(householdId: string, id: string) {
		const [r] = await db
			.select()
			.from(pensions)
			.where(and(eq(pensions.householdId, householdId), eq(pensions.id, id)))
			.limit(1);
		return r ?? null;
	},
	async listPensions(i: {
		householdId: string;
		memberId?: string;
		isActive?: boolean;
		limit: number;
		offset: number;
	}) {
		return db
			.select()
			.from(pensions)
			.where(and(...pensionConditions(i)))
			.orderBy(desc(pensions.createdAt), desc(pensions.id))
			.limit(i.limit)
			.offset(i.offset);
	},
	async countPensions(i: {
		householdId: string;
		memberId?: string;
		isActive?: boolean;
	}) {
		const [r] = await db
			.select({ total: count() })
			.from(pensions)
			.where(and(...pensionConditions(i)));
		return r?.total ?? 0;
	},
	async updatePension(householdId: string, id: string, v: Partial<NewPension>) {
		const [r] = await db
			.update(pensions)
			.set({ ...v, updatedAt: new Date() })
			.where(and(eq(pensions.householdId, householdId), eq(pensions.id, id)))
			.returning();
		return r ?? null;
	},
	async deletePension(householdId: string, id: string) {
		return (
			(
				await db
					.delete(pensions)
					.where(
						and(eq(pensions.householdId, householdId), eq(pensions.id, id)),
					)
					.returning({ id: pensions.id })
			).length > 0
		);
	},
};
export type { Employment, Pension };
