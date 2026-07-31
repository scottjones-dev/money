// src/modules/affordability/affordability.repository.ts
import { and, eq } from "drizzle-orm";

import { debts, expenses, incomeSources } from "@/db/schema";
import { db } from "@/lib/database";

export const affordabilityRepository = {
	async listActiveIncomeSources(householdId: string) {
		return db
			.select()
			.from(incomeSources)
			.where(
				and(
					eq(incomeSources.householdId, householdId),
					eq(incomeSources.isActive, true),
				),
			);
	},

	async listActiveExpenses(householdId: string) {
		return db
			.select()
			.from(expenses)
			.where(
				and(
					eq(expenses.householdId, householdId),
					eq(expenses.isActive, true),
					eq(expenses.includeInBudget, true),
				),
			);
	},

	async listActiveDebts(householdId: string) {
		return db
			.select()
			.from(debts)
			.where(
				and(eq(debts.householdId, householdId), eq(debts.status, "active")),
			);
	},
};
