import { auth } from "@/lib/auth";
import { householdsRepository } from "./households.repository";
import type {
	CreateHouseholdInput,
	HouseholdResponse,
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

	async list(userId: string): Promise<HouseholdResponse[]> {
		const households = await householdsRepository.findAllForUser(userId);

		return households.map(mapHouseholdResponse);
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
};
