import { AppError } from "@/shared/errors/app-error";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import { membersRepository } from "./members.repository";
import type {
	CreateHouseholdMemberInput,
	HouseholdMemberResponse,
	ListMembersQuery,
	UpdateHouseholdMemberInput,
} from "./members.schemas";

const HOUSEHOLD_WRITE_ROLES = new Set(["owner", "admin", "member"]);

function assertCanWrite(role: string): void {
	if (!HOUSEHOLD_WRITE_ROLES.has(role)) {
		throw new AppError({
			code: "INSUFFICIENT_HOUSEHOLD_PERMISSION",
			message: "You do not have permission to change household members.",
			statusCode: 403,
		});
	}
}

function mapMemberResponse(input: {
	id: string;
	householdId: string;
	authUserId: string | null;
	firstName: string;
	lastName: string | null;
	memberType: "adult" | "child" | "non_dependent";
	relationship:
		| "self"
		| "partner"
		| "child"
		| "step_child"
		| "foster_child"
		| "other_dependent"
		| "non_dependent"
		| "other";
	dateOfBirth: string | null;
	isClaimant: boolean;
	isPartner: boolean;
	isDependent: boolean;
	employmentStatus:
		| "employed"
		| "self_employed"
		| "unemployed"
		| "student"
		| "retired"
		| "not_working"
		| "unknown";
	isStudent: boolean;
	hasDisability: boolean;
	createdAt: Date;
	updatedAt: Date;
}): HouseholdMemberResponse {
	return {
		id: input.id,
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
		createdAt: input.createdAt.toISOString(),
		updatedAt: input.updatedAt.toISOString(),
	};
}

async function ensureAuthUserIsAvailable(input: {
	householdId: string;
	authUserId?: string;
	excludeMemberId?: string;
}): Promise<void> {
	if (!input.authUserId) {
		return;
	}

	const existingMember = await membersRepository.findByAuthUserId({
		householdId: input.householdId,
		authUserId: input.authUserId,
		excludeMemberId: input.excludeMemberId,
	});

	if (existingMember) {
		throw new AppError({
			code: "AUTH_USER_ALREADY_LINKED",
			message:
				"This user account is already linked to a member of this household.",
			statusCode: 409,
		});
	}
}

async function ensureClaimantLimit(input: {
	householdId: string;
	isClaimant?: boolean;
	excludeMemberId?: string;
}): Promise<void> {
	if (input.isClaimant !== true) {
		return;
	}

	const claimantCount = await membersRepository.countClaimants({
		householdId: input.householdId,
		excludeMemberId: input.excludeMemberId,
	});

	if (claimantCount >= 2) {
		throw new AppError({
			code: "HOUSEHOLD_CLAIMANT_LIMIT_REACHED",
			message: "A household cannot have more than two claimants.",
			statusCode: 409,
		});
	}
}

async function ensureRelationshipLimit(input: {
	householdId: string;
	relationship?: CreateHouseholdMemberInput["relationship"];
	excludeMemberId?: string;
}): Promise<void> {
	if (input.relationship !== "self" && input.relationship !== "partner") {
		return;
	}

	const relationshipCount = await membersRepository.countByRelationship({
		householdId: input.householdId,
		relationship: input.relationship,
		excludeMemberId: input.excludeMemberId,
	});

	if (relationshipCount > 0) {
		throw new AppError({
			code:
				input.relationship === "self"
					? "HOUSEHOLD_SELF_MEMBER_EXISTS"
					: "HOUSEHOLD_PARTNER_EXISTS",
			message:
				input.relationship === "self"
					? "The household already has a self member."
					: "The household already has a partner member.",
			statusCode: 409,
		});
	}
}

export const membersService = {
	async create(input: {
		householdId: string;
		role: string;
		data: CreateHouseholdMemberInput;
	}): Promise<HouseholdMemberResponse> {
		assertCanWrite(input.role);

		await Promise.all([
			ensureAuthUserIsAvailable({
				householdId: input.householdId,
				authUserId: input.data.authUserId,
			}),
			ensureClaimantLimit({
				householdId: input.householdId,
				isClaimant: input.data.isClaimant,
			}),
			ensureRelationshipLimit({
				householdId: input.householdId,
				relationship: input.data.relationship,
			}),
		]);

		const member = await membersRepository.create({
			householdId: input.householdId,
			authUserId: input.data.authUserId,
			firstName: input.data.firstName,
			lastName: input.data.lastName,
			memberType: input.data.memberType,
			relationship: input.data.relationship,
			dateOfBirth: input.data.dateOfBirth,
			isClaimant: input.data.isClaimant,
			isPartner:
				input.data.relationship === "partner" ? true : input.data.isPartner,
			isDependent: input.data.isDependent,
			employmentStatus: input.data.employmentStatus,
			isStudent: input.data.isStudent,
			hasDisability: input.data.hasDisability,
		});

		return mapMemberResponse(member);
	},

	async list(input: { householdId: string; query: ListMembersQuery }) {
		const [members, totalItems] = await Promise.all([
			membersRepository.findAllByHouseholdId({
				householdId: input.householdId,
				limit: input.query.pageSize,
				offset: getPaginationOffset(input.query),
			}),
			membersRepository.countByHouseholdId(input.householdId),
		]);

		return {
			data: members.map(mapMemberResponse),
			pagination: createPaginationMeta({
				...input.query,
				totalItems,
			}),
		};
	},

	async get(input: {
		householdId: string;
		memberId: string;
	}): Promise<HouseholdMemberResponse | null> {
		const member = await membersRepository.findById(input);

		return member ? mapMemberResponse(member) : null;
	},

	async update(input: {
		householdId: string;
		memberId: string;
		role: string;
		data: UpdateHouseholdMemberInput;
	}): Promise<HouseholdMemberResponse> {
		assertCanWrite(input.role);

		const existingMember = await membersRepository.findById({
			householdId: input.householdId,
			memberId: input.memberId,
		});

		if (!existingMember) {
			throw new AppError({
				code: "HOUSEHOLD_MEMBER_NOT_FOUND",
				message: "The household member could not be found.",
				statusCode: 404,
			});
		}

		const resultingAuthUserId =
			input.data.authUserId ?? existingMember.authUserId ?? undefined;

		const resultingClaimant =
			input.data.isClaimant ?? existingMember.isClaimant;

		const resultingRelationship =
			input.data.relationship ?? existingMember.relationship;

		await Promise.all([
			ensureAuthUserIsAvailable({
				householdId: input.householdId,
				authUserId: resultingAuthUserId,
				excludeMemberId: input.memberId,
			}),
			ensureClaimantLimit({
				householdId: input.householdId,
				isClaimant: resultingClaimant,
				excludeMemberId: input.memberId,
			}),
			ensureRelationshipLimit({
				householdId: input.householdId,
				relationship: resultingRelationship,
				excludeMemberId: input.memberId,
			}),
		]);

		const updatedMember = await membersRepository.update({
			householdId: input.householdId,
			memberId: input.memberId,
			data: {
				...input.data,
				isPartner:
					resultingRelationship === "partner" ? true : input.data.isPartner,
			},
		});

		if (!updatedMember) {
			throw new AppError({
				code: "HOUSEHOLD_MEMBER_NOT_FOUND",
				message: "The household member could not be found.",
				statusCode: 404,
			});
		}

		return mapMemberResponse(updatedMember);
	},

	async delete(input: {
		householdId: string;
		memberId: string;
		role: string;
	}): Promise<{ deletedMemberId: string }> {
		assertCanWrite(input.role);

		const member = await membersRepository.findById({
			householdId: input.householdId,
			memberId: input.memberId,
		});

		if (!member) {
			throw new AppError({
				code: "HOUSEHOLD_MEMBER_NOT_FOUND",
				message: "The household member could not be found.",
				statusCode: 404,
			});
		}

		const deleted = await membersRepository.delete({
			householdId: input.householdId,
			memberId: input.memberId,
		});

		if (!deleted) {
			throw new AppError({
				code: "HOUSEHOLD_MEMBER_NOT_FOUND",
				message: "The household member could not be found.",
				statusCode: 404,
			});
		}

		return {
			deletedMemberId: deleted.id,
		};
	},
};
