import { and, count, desc, eq } from "drizzle-orm";
import {
	type FinancialRecord,
	financialRecords,
	type NewFinancialRecord,
} from "@/db/schema";
import { db } from "@/lib/database";
export type RecordKind = FinancialRecord["kind"];
const where = (h: string, kind: RecordKind, history: boolean) =>
	history
		? and(eq(financialRecords.householdId, h), eq(financialRecords.kind, kind))
		: and(
				eq(financialRecords.householdId, h),
				eq(financialRecords.kind, kind),
				eq(financialRecords.isCurrent, true),
			);
export const recordsRepository = {
	async findCurrent(h: string, kind: RecordKind) {
		const [v] = await db
			.select()
			.from(financialRecords)
			.where(
				and(
					eq(financialRecords.householdId, h),
					eq(financialRecords.kind, kind),
					eq(financialRecords.isCurrent, true),
				),
			)
			.orderBy(desc(financialRecords.createdAt))
			.limit(1);
		return v ?? null;
	},
	async createVersion(values: NewFinancialRecord, previous?: FinancialRecord) {
		return db.transaction(async (tx) => {
			if (previous)
				await tx
					.update(financialRecords)
					.set({ isCurrent: false, updatedAt: new Date() })
					.where(
						and(
							eq(financialRecords.householdId, values.householdId),
							eq(financialRecords.id, previous.id),
						),
					);
			const [v] = await tx.insert(financialRecords).values(values).returning();
			if (!v) throw new Error("Financial record insertion failed.");
			return v;
		});
	},
	async find(h: string, kind: RecordKind, id: string) {
		const [v] = await db
			.select()
			.from(financialRecords)
			.where(
				and(
					eq(financialRecords.householdId, h),
					eq(financialRecords.kind, kind),
					eq(financialRecords.id, id),
				),
			)
			.limit(1);
		return v ?? null;
	},
	async list(
		h: string,
		kind: RecordKind,
		history: boolean,
		limit: number,
		offset: number,
	) {
		return db
			.select()
			.from(financialRecords)
			.where(where(h, kind, history))
			.orderBy(desc(financialRecords.createdAt), desc(financialRecords.id))
			.limit(limit)
			.offset(offset);
	},
	async count(h: string, kind: RecordKind, history: boolean) {
		const [v] = await db
			.select({ total: count() })
			.from(financialRecords)
			.where(where(h, kind, history));
		return v?.total ?? 0;
	},
	async delete(h: string, kind: RecordKind, id: string) {
		return (
			(
				await db
					.delete(financialRecords)
					.where(
						and(
							eq(financialRecords.householdId, h),
							eq(financialRecords.kind, kind),
							eq(financialRecords.id, id),
						),
					)
					.returning({ id: financialRecords.id })
			).length > 0
		);
	},
};
