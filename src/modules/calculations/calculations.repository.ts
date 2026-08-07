import { and, count, desc, eq, isNull } from "drizzle-orm";
import {
	type Calculation,
	calculations,
	expenses,
	incomeSources,
	type NewCalculation,
} from "@/db/schema";
import { db } from "@/lib/database";
export const calculationsRepository = {
	async create(values: NewCalculation) {
		const [v] = await db.insert(calculations).values(values).returning();
		if (!v) throw new Error("Calculation insertion failed.");
		return v;
	},
	async find(householdId: string, id: string) {
		const [v] = await db
			.select()
			.from(calculations)
			.where(
				and(
					eq(calculations.householdId, householdId),
					eq(calculations.id, id),
					isNull(calculations.deletedAt),
				),
			)
			.limit(1);
		return v ?? null;
	},
	async list(i: {
		householdId: string;
		type?: Calculation["type"];
		status?: Calculation["status"];
		limit: number;
		offset: number;
	}) {
		const c = [
			eq(calculations.householdId, i.householdId),
			isNull(calculations.deletedAt),
		];
		if (i.type) c.push(eq(calculations.type, i.type));
		if (i.status) c.push(eq(calculations.status, i.status));
		return db
			.select()
			.from(calculations)
			.where(and(...c))
			.orderBy(desc(calculations.createdAt), desc(calculations.id))
			.limit(i.limit)
			.offset(i.offset);
	},
	async count(i: {
		householdId: string;
		type?: Calculation["type"];
		status?: Calculation["status"];
	}) {
		const c = [
			eq(calculations.householdId, i.householdId),
			isNull(calculations.deletedAt),
		];
		if (i.type) c.push(eq(calculations.type, i.type));
		if (i.status) c.push(eq(calculations.status, i.status));
		const [v] = await db
			.select({ total: count() })
			.from(calculations)
			.where(and(...c));
		return v?.total ?? 0;
	},
	async softDelete(householdId: string, id: string) {
		return (
			(
				await db
					.update(calculations)
					.set({ deletedAt: new Date(), updatedAt: new Date() })
					.where(
						and(
							eq(calculations.householdId, householdId),
							eq(calculations.id, id),
							isNull(calculations.deletedAt),
						),
					)
					.returning({ id: calculations.id })
			).length > 0
		);
	},
	async commit(i: {
		householdId: string;
		calculationId: string;
		userId: string;
		derived?:
			| {
					direction: "income" | "expense";
					memberId?: string | null;
					type: string;
					name: string;
					monthlyAmount: string;
					key?: string;
			  }
			| Array<{
					direction: "income" | "expense";
					memberId?: string | null;
					type: string;
					name: string;
					monthlyAmount: string;
					key?: string;
			  }>;
	}) {
		return db.transaction(async (tx) => {
			const [current] = await tx
				.select()
				.from(calculations)
				.where(
					and(
						eq(calculations.householdId, i.householdId),
						eq(calculations.id, i.calculationId),
						isNull(calculations.deletedAt),
					),
				)
				.limit(1)
				.for("update");
			if (!current) return null;
			if (current.committedAt) return current;
			const links: Array<{ resourceType: string; resourceId: string }> = [];
			const derivedRecords = i.derived
				? Array.isArray(i.derived)
					? i.derived
					: [i.derived]
				: [];
			for (const derived of derivedRecords) {
				if (derived.direction === "income" && derived.memberId) {
					const [v] = await tx
						.insert(incomeSources)
						.values({
							householdId: i.householdId,
							memberId: derived.memberId,
							type: derived.type as "employment" | "benefit" | "maintenance",
							name: derived.name,
							grossAmount: derived.monthlyAmount,
							frequency: "monthly",
							isTaxable: false,
							sourceCalculationId: i.calculationId,
							sourceCalculationKey: derived.key ?? "primary",
						})
						.onConflictDoUpdate({
							target: [
								incomeSources.sourceCalculationId,
								incomeSources.sourceCalculationKey,
							],
							set: {
								grossAmount: derived.monthlyAmount,
								updatedAt: new Date(),
							},
						})
						.returning({ id: incomeSources.id });
					if (v)
						links.push({ resourceType: "income_source", resourceId: v.id });
				}
				if (derived.direction === "expense") {
					const [v] = await tx
						.insert(expenses)
						.values({
							householdId: i.householdId,
							memberId: derived.memberId ?? null,
							category: "maintenance",
							priority: "important",
							name: derived.name,
							amount: derived.monthlyAmount,
							frequency: "monthly",
							sourceCalculationId: i.calculationId,
						})
						.onConflictDoUpdate({
							target: expenses.sourceCalculationId,
							set: { amount: derived.monthlyAmount, updatedAt: new Date() },
						})
						.returning({ id: expenses.id });
					if (v) links.push({ resourceType: "expense", resourceId: v.id });
				}
			}
			const [updated] = await tx
				.update(calculations)
				.set({
					committedAt: new Date(),
					committedBy: i.userId,
					committedLinks: links,
					updatedAt: new Date(),
				})
				.where(eq(calculations.id, i.calculationId))
				.returning();
			return updated ?? null;
		});
	},
};
