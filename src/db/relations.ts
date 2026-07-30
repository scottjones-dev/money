import { defineRelations } from "drizzle-orm";

import * as schema from "@/db/schema";

export const relations = defineRelations(schema, (r) => ({
	households: {
		members: r.many.householdMembers(),
	},
	householdMembers: {
		household: r.one.households({
			from: r.householdMembers.householdId,
			to: r.households.id,
		}),
	},
}));