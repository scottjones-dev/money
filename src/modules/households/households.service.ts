import { auth } from "@/lib/auth";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import { householdsRepository } from "./households.repository";
import type {
	CreateHouseholdInput,
	HouseholdResponse,
	ListHouseholdsQuery,
	UpdateHouseholdInput,
} from "./households.schemas";

function createOrganizationSlug(name: string): string {
	const base = name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);

	const suffix = crypto.randomUUID().slice(0, 8);

	return `${base || "household"}-${suffix}`;
}

function mapHouseholdResponse(input: {
	id: string;
	organizationId: string;
	name: string;
	currency: string;
	country: string;
	postcodeArea: string | null;
	nation: "england" | "scotland" | "wales" | "northern_ireland" | null;
	role: string;
	createdAt: Date;
	updatedAt: Date;
}): HouseholdResponse {
	return {
		id: input.id,
		organizationId: input.organizationId,
		name: input.name,
		currency: "GBP",
		country: "GB",
		postcodeArea: input.postcodeArea,
		nation: input.nation,
		role: input.role,
		createdAt: input.createdAt.toISOString(),
		updatedAt: input.updatedAt.toISOString(),
	};
}

export const householdsService = {
	async create(input: {
		userId: string;
		headers: Headers;
		data: CreateHouseholdInput;
	}): Promise<HouseholdResponse> {
		const organization = await auth.api.createOrganization({
			headers: input.headers,
			body: {
				name: input.data.name,
				slug: createOrganizationSlug(input.data.name),
				keepCurrentActiveOrganization: true,
			},
		});

		if (!organization) {
			throw new Error("Better Auth did not return the created organization.");
		}

		try {
			const household = await householdsRepository.create({
				organizationId: organization.id,
				name: input.data.name,
				postcodeArea: input.data.postcodeArea,
				nation: input.data.nation,
			});

			return mapHouseholdResponse({
				...household,
				role: "owner",
			});
		} catch (error) {
			/*
			 * Compensation:
			 * organization creation and household creation cannot share
			 * one ordinary Drizzle transaction because Better Auth performs
			 * the organization operation through its own API.
			 */
			try {
				await auth.api.deleteOrganization({
					headers: input.headers,
					body: {
						organizationId: organization.id,
					},
				});
			} catch {
				// The original household error remains the primary failure.
			}

			throw error;
		}
	},

	async list(input: { userId: string; query: ListHouseholdsQuery }) {
		const [households, totalItems] = await Promise.all([
			householdsRepository.findAllForUser({
				userId: input.userId,
				limit: input.query.pageSize,
				offset: getPaginationOffset(input.query),
			}),
			householdsRepository.countForUser(input.userId),
		]);

		return {
			data: households.map(mapHouseholdResponse),
			pagination: createPaginationMeta({
				...input.query,
				totalItems,
			}),
		};
	},

	async get(input: {
		userId: string;
		householdId: string;
	}): Promise<HouseholdResponse | null> {
		const household = await householdsRepository.findForUser(input);

		if (!household) {
			return null;
		}

		return mapHouseholdResponse(household);
	},

	async update(input: {
		userId: string;
		householdId: string;
		data: UpdateHouseholdInput;
	}): Promise<HouseholdResponse | null> {
		const current = await householdsRepository.findForUser(input);
		if (!current || (current.role !== "owner" && current.role !== "admin"))
			return null;
		const updated = await householdsRepository.update({
			householdId: input.householdId,
			values: input.data,
		});
		return updated
			? mapHouseholdResponse({ ...updated, role: current.role })
			: null;
	},
};
