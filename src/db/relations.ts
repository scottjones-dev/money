import { defineRelations } from "drizzle-orm";

import * as schema from "@/db/schema";

export const relations = defineRelations(schema, (relations) => ({
	households: {
		organization: relations.one.organization({
			from: relations.households.organizationId,
			to: relations.organization.id,
		}),
	},
}));