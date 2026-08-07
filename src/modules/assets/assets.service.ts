import Decimal from "decimal.js";
import type { Asset } from "@/db/schema";
import { membersRepository } from "@/modules/members/members.repository";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import type { HouseholdRole } from "@/types/app";
import { assetsRepository } from "./assets.repository";
import type {
	AssetResponse,
	CreateAssetInput,
	ListAssetsQuery,
	UpdateAssetInput,
} from "./assets.schemas";

const map = (a: Asset): AssetResponse => ({
	...a,
	createdAt: a.createdAt.toISOString(),
	updatedAt: a.updatedAt.toISOString(),
});
const moneyValue = (value: string) => new Decimal(value).toFixed(2);
const manage = (role: HouseholdRole) => {
	if (role === "viewer")
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message: "You do not have permission to change assets.",
			statusCode: 403,
		});
};
const required = async (householdId: string, assetId: string) => {
	const a = await assetsRepository.find({ householdId, assetId });
	if (!a)
		throw new AppError({
			code: ERROR_CODES.RESOURCE_NOT_FOUND,
			message: "The asset could not be found.",
			statusCode: 404,
		});
	return a;
};
const member = async (householdId: string, memberId?: string | null) => {
	if (
		memberId &&
		!(await membersRepository.findById({ householdId, memberId }))
	)
		throw new AppError({
			code: ERROR_CODES.HOUSEHOLD_MEMBER_NOT_FOUND,
			message: "The member could not be found.",
			statusCode: 404,
		});
};
const values = (v: CreateAssetInput | UpdateAssetInput) => ({
	...v,
	...(v.currentValue !== undefined
		? { currentValue: new Decimal(v.currentValue).toFixed(2) }
		: {}),
	...(v.purchaseValue !== undefined
		? {
				purchaseValue:
					v.purchaseValue === null
						? null
						: new Decimal(v.purchaseValue).toFixed(2),
			}
		: {}),
});
export const assetsService = {
	async create(i: {
		householdId: string;
		role: HouseholdRole;
		data: CreateAssetInput;
	}) {
		manage(i.role);
		await member(i.householdId, i.data.memberId);
		return map(
			await assetsRepository.create({
				householdId: i.householdId,
				memberId: i.data.memberId ?? null,
				type: i.data.type,
				ownershipType: i.data.ownershipType,
				name: i.data.name,
				currentValue: moneyValue(i.data.currentValue),
				purchaseValue:
					i.data.purchaseValue == null
						? null
						: moneyValue(i.data.purchaseValue),
				purchaseDate: i.data.purchaseDate ?? null,
				valuationDate: i.data.valuationDate ?? null,
				isLiquid: i.data.isLiquid,
				includeInNetWorth: i.data.includeInNetWorth,
				isActive: i.data.isActive,
				notes: i.data.notes ?? null,
			}),
		);
	},
	async list(i: { householdId: string; query: ListAssetsQuery }) {
		const filters = {
			householdId: i.householdId,
			memberId: i.query.memberId,
			type: i.query.type,
			isActive: i.query.isActive,
		};
		const [items, totalItems] = await Promise.all([
			assetsRepository.list({
				...filters,
				limit: i.query.pageSize,
				offset: getPaginationOffset(i.query),
			}),
			assetsRepository.count(filters),
		]);
		return {
			data: items.map(map),
			pagination: createPaginationMeta({ ...i.query, totalItems }),
		};
	},
	async get(i: { householdId: string; assetId: string }) {
		return map(await required(i.householdId, i.assetId));
	},
	async update(i: {
		householdId: string;
		assetId: string;
		role: HouseholdRole;
		data: UpdateAssetInput;
	}) {
		manage(i.role);
		await required(i.householdId, i.assetId);
		await member(i.householdId, i.data.memberId);
		const updated = await assetsRepository.update({
			householdId: i.householdId,
			assetId: i.assetId,
			values: values(i.data),
		});
		if (!updated) throw new Error("Asset update failed.");
		return map(updated);
	},
	async delete(i: {
		householdId: string;
		assetId: string;
		role: HouseholdRole;
	}) {
		manage(i.role);
		await required(i.householdId, i.assetId);
		await assetsRepository.delete(i);
		return { success: true as const, deletedId: i.assetId };
	},
};
