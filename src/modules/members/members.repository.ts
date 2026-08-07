import { and, asc, count, eq, ne } from "drizzle-orm";

import {
	householdMembers,
	type NewHouseholdMember,
} from "@/db/schema/members.schema";
import { db } from "@/lib/database";

export interface CreateHouseholdMemberRecordInput {
	householdId: string;
	authUserId?: string;
	firstName: string;
	lastName?: string;
	memberType: NewHouseholdMember["memberType"];
	relationship: NewHouseholdMember["relationship"];
	dateOfBirth?: string;
	isClaimant: boolean;
	isPartner: boolean;
	isDependent: boolean;
	employmentStatus: NewHouseholdMember["employmentStatus"];
	isStudent: boolean;
	hasDisability: boolean;
}

export interface UpdateHouseholdMemberRecordInput {
	authUserId?: string | null;
	firstName?: string;
	lastName?: string | null;
	memberType?: NewHouseholdMember["memberType"];
	relationship?: NewHouseholdMember["relationship"];
	dateOfBirth?: string | null;
	isClaimant?: boolean;
	isPartner?: boolean;
	isDependent?: boolean;
	employmentStatus?: NewHouseholdMember["employmentStatus"];
	isStudent?: boolean;
	hasDisability?: boolean;
}

export const membersRepository = {
	async create(input: CreateHouseholdMemberRecordInput) {
		const [member] = await db
			.insert(householdMembers)
			.values({
				householdId: input.householdId,
				authUserId: input.authUserId,
				firstName: input.firstName,
				lastName: input.lastName,
				memberType: input.memberType,
				relationship: input.relationship,
				dateOfBirth: input.dateOfBirth,
				isClaimant: input.isClaimant,
				isPartner: input.isPartner,
				isDependent: input.isDependent,
				employmentStatus: input.employmentStatus,
				isStudent: input.isStudent,
				hasDisability: input.hasDisability,
			})
			.returning();

		if (!member) {
			throw new Error("Failed to create household member.");
		}

		return member;
	},

	async findAllByHouseholdId(input: {
		householdId: string;
		limit: number;
		offset: number;
	}) {
		return db
			.select()
			.from(householdMembers)
			.where(eq(householdMembers.householdId, input.householdId))
			.orderBy(
				asc(householdMembers.memberType),
				asc(householdMembers.firstName),
				asc(householdMembers.id),
			)
			.limit(input.limit)
			.offset(input.offset);
	},

	async countByHouseholdId(householdId: string): Promise<number> {
		const [result] = await db
			.select({ count: count() })
			.from(householdMembers)
			.where(eq(householdMembers.householdId, householdId));

		return result?.count ?? 0;
	},

	async findById(input: { householdId: string; memberId: string }) {
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

	async findByAuthUserId(input: {
		householdId: string;
		authUserId: string;
		excludeMemberId?: string;
	}) {
		const conditions = [
			eq(householdMembers.householdId, input.householdId),
			eq(householdMembers.authUserId, input.authUserId),
		];

		if (input.excludeMemberId) {
			conditions.push(ne(householdMembers.id, input.excludeMemberId));
		}

		const [member] = await db
			.select()
			.from(householdMembers)
			.where(and(...conditions))
			.limit(1);

		return member ?? null;
	},

	async countClaimants(input: {
		householdId: string;
		excludeMemberId?: string;
	}): Promise<number> {
		const conditions = [
			eq(householdMembers.householdId, input.householdId),
			eq(householdMembers.isClaimant, true),
		];

		if (input.excludeMemberId) {
			conditions.push(ne(householdMembers.id, input.excludeMemberId));
		}

		const [result] = await db
			.select({
				value: count(),
			})
			.from(householdMembers)
			.where(and(...conditions));

		return Number(result?.value ?? 0);
	},

	async countByRelationship(input: {
		householdId: string;
		relationship: NewHouseholdMember["relationship"];
		excludeMemberId?: string;
	}): Promise<number> {
		const conditions = [
			eq(householdMembers.householdId, input.householdId),
			eq(householdMembers.relationship, input.relationship),
		];

		if (input.excludeMemberId) {
			conditions.push(ne(householdMembers.id, input.excludeMemberId));
		}

		const [result] = await db
			.select({
				value: count(),
			})
			.from(householdMembers)
			.where(and(...conditions));

		return Number(result?.value ?? 0);
	},

	async update(input: {
		householdId: string;
		memberId: string;
		data: UpdateHouseholdMemberRecordInput;
	}) {
		const [member] = await db
			.update(householdMembers)
			.set({
				...input.data,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(householdMembers.id, input.memberId),
					eq(householdMembers.householdId, input.householdId),
				),
			)
			.returning();

		return member ?? null;
	},

	async delete(input: { householdId: string; memberId: string }) {
		const [member] = await db
			.delete(householdMembers)
			.where(
				and(
					eq(householdMembers.id, input.memberId),
					eq(householdMembers.householdId, input.householdId),
				),
			)
			.returning({
				id: householdMembers.id,
			});

		return member ?? null;
	},
};
