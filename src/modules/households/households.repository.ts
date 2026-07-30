import { and, desc, eq } from "drizzle-orm";

import { member } from "@/db/schema/auth.schema";
import {
	households,
	type NewHousehold,
} from "@/db/schema/households.schema";
import { db } from "@/lib/database";

export interface CreateHouseholdRecordInput {
	organizationId: string;
	name: string;
	postcodeArea?: string;
}

export const householdsRepository = {
	async create(input: CreateHouseholdRecordInput) {
		const [household] = await db
			.insert(households)
			.values({
				organizationId: input.organizationId,
				name: input.name,
				postcodeArea: input.postcodeArea,
			} satisfies NewHousehold)
			.returning();

		if (!household) {
			throw new Error("Failed to create household.");
		}

		return household;
	},

	async deleteByOrganizationId(
		organizationId: string,
	): Promise<void> {
		await db
			.delete(households)
			.where(eq(households.organizationId, organizationId));
	},

	async findAllForUser(userId: string) {
		return db
			.select({
				id: households.id,
				organizationId: households.organizationId,
				name: households.name,
				currency: households.currency,
				country: households.country,
				postcodeArea: households.postcodeArea,
				role: member.role,
				createdAt: households.createdAt,
				updatedAt: households.updatedAt,
			})
			.from(member)
			.innerJoin(
				households,
				eq(
					member.organizationId,
					households.organizationId,
				),
			)
			.where(eq(member.userId, userId))
			.orderBy(desc(households.createdAt));
	},

	async findForUser(input: {
		userId: string;
		householdId: string;
	}) {
		const [household] = await db
			.select({
				id: households.id,
				organizationId: households.organizationId,
				name: households.name,
				currency: households.currency,
				country: households.country,
				postcodeArea: households.postcodeArea,
				role: member.role,
				createdAt: households.createdAt,
				updatedAt: households.updatedAt,
			})
			.from(households)
			.innerJoin(
				member,
				eq(
					member.organizationId,
					households.organizationId,
				),
			)
			.where(
				and(
					eq(households.id, input.householdId),
					eq(member.userId, input.userId),
				),
			)
			.limit(1);

		return household ?? null;
	},

	async findMembership(input: {
		userId: string;
		householdId: string;
	}) {
		const [result] = await db
			.select({
				id: households.id,
				organizationId: households.organizationId,
				name: households.name,
				role: member.role,
			})
			.from(households)
			.innerJoin(
				member,
				eq(
					member.organizationId,
					households.organizationId,
				),
			)
			.where(
				and(
					eq(households.id, input.householdId),
					eq(member.userId, input.userId),
				),
			)
			.limit(1);

		return result ?? null;
	},
};