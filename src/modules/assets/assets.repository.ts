import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { type Asset, assets, type NewAsset } from "@/db/schema";
import { db } from "@/lib/database";

const conditions = (i: {
	householdId: string;
	memberId?: string;
	type?: Asset["type"];
	isActive?: boolean;
}): SQL[] => {
	const result: SQL[] = [eq(assets.householdId, i.householdId)];
	if (i.memberId) result.push(eq(assets.memberId, i.memberId));
	if (i.type) result.push(eq(assets.type, i.type));
	if (i.isActive !== undefined) result.push(eq(assets.isActive, i.isActive));
	return result;
};
export const assetsRepository = {
	async create(values: NewAsset) {
		const [v] = await db.insert(assets).values(values).returning();
		if (!v) throw new Error("Asset insertion failed.");
		return v;
	},
	async find(input: { householdId: string; assetId: string }) {
		const [v] = await db
			.select()
			.from(assets)
			.where(
				and(
					eq(assets.householdId, input.householdId),
					eq(assets.id, input.assetId),
				),
			)
			.limit(1);
		return v ?? null;
	},
	async list(input: {
		householdId: string;
		memberId?: string;
		type?: Asset["type"];
		isActive?: boolean;
		limit: number;
		offset: number;
	}) {
		return db
			.select()
			.from(assets)
			.where(and(...conditions(input)))
			.orderBy(desc(assets.createdAt), desc(assets.id))
			.limit(input.limit)
			.offset(input.offset);
	},
	async count(input: {
		householdId: string;
		memberId?: string;
		type?: Asset["type"];
		isActive?: boolean;
	}) {
		const [v] = await db
			.select({ total: count() })
			.from(assets)
			.where(and(...conditions(input)));
		return v?.total ?? 0;
	},
	async update(input: {
		householdId: string;
		assetId: string;
		values: Partial<NewAsset>;
	}) {
		const [v] = await db
			.update(assets)
			.set({ ...input.values, updatedAt: new Date() })
			.where(
				and(
					eq(assets.householdId, input.householdId),
					eq(assets.id, input.assetId),
				),
			)
			.returning();
		return v ?? null;
	},
	async delete(input: { householdId: string; assetId: string }) {
		return (
			(
				await db
					.delete(assets)
					.where(
						and(
							eq(assets.householdId, input.householdId),
							eq(assets.id, input.assetId),
						),
					)
					.returning({ id: assets.id })
			).length > 0
		);
	},
};
