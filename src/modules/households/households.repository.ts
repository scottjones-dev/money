import { and, count, desc, eq } from "drizzle-orm";

import { member } from "@/db/schema/auth.schema";
import { households, type NewHousehold } from "@/db/schema/households.schema";
import { db } from "@/lib/database";

export interface CreateHouseholdRecordInput {
	organizationId: string;
	name: string;
	postcodeArea?: string;
	nation?: "england" | "scotland" | "wales" | "northern_ireland";
}

export const householdsRepository = {
	async findById(householdId: string) {
		const [household] = await db
			.select()
			.from(households)
			.where(eq(households.id, householdId))
			.limit(1);
		return household ?? null;
	},
	async create(input: CreateHouseholdRecordInput) {
		const [household] = await db
			.insert(households)
			.values({
				organizationId: input.organizationId,
				name: input.name,
				postcodeArea: input.postcodeArea,
				nation: input.nation,
			} satisfies NewHousehold)
			.returning();

		if (!household) {
			throw new Error("Failed to create household.");
		}

		return household;
	},

	async deleteByOrganizationId(organizationId: string): Promise<void> {
		await db
			.delete(households)
			.where(eq(households.organizationId, organizationId));
	},

	async findAllForUser(input: {
		userId: string;
		limit: number;
		offset: number;
	}) {
		return db
			.select({
				id: households.id,
				organizationId: households.organizationId,
				name: households.name,
				currency: households.currency,
				country: households.country,
				postcodeArea: households.postcodeArea,
				nation: households.nation,
				role: member.role,
				createdAt: households.createdAt,
				updatedAt: households.updatedAt,
			})
			.from(member)
			.innerJoin(
				households,
				eq(member.organizationId, households.organizationId),
			)
			.where(eq(member.userId, input.userId))
			.orderBy(desc(households.createdAt), desc(households.id))
			.limit(input.limit)
			.offset(input.offset);
	},

	async countForUser(userId: string): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(member)
			.innerJoin(
				households,
				eq(member.organizationId, households.organizationId),
			)
			.where(eq(member.userId, userId));

		return result?.count ?? 0;
	},

	async findForUser(input: { userId: string; householdId: string }) {
		const [household] = await db
			.select({
				id: households.id,
				organizationId: households.organizationId,
				name: households.name,
				currency: households.currency,
				country: households.country,
				postcodeArea: households.postcodeArea,
				nation: households.nation,
				role: member.role,
				createdAt: households.createdAt,
				updatedAt: households.updatedAt,
			})
			.from(households)
			.innerJoin(member, eq(member.organizationId, households.organizationId))
			.where(
				and(
					eq(households.id, input.householdId),
					eq(member.userId, input.userId),
				),
			)
			.limit(1);

		return household ?? null;
	},

	async findMembership(input: { userId: string; householdId: string }) {
		const [result] = await db
			.select({
				id: households.id,
				organizationId: households.organizationId,
				name: households.name,
				role: member.role,
			})
			.from(households)
			.innerJoin(member, eq(member.organizationId, households.organizationId))
			.where(
				and(
					eq(households.id, input.householdId),
					eq(member.userId, input.userId),
				),
			)
			.limit(1);

		return result ?? null;
	},

	async update(input: {
		householdId: string;
		values: {
			name?: string;
			postcodeArea?: string | null;
			nation?: "england" | "scotland" | "wales" | "northern_ireland" | null;
		};
	}) {
		const [updated] = await db
			.update(households)
			.set({ ...input.values, updatedAt: new Date() })
			.where(eq(households.id, input.householdId))
			.returning();
		return updated ?? null;
	},
};
