import {
	index,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { organization } from "./auth.schema";

export const households = pgTable(
	"households",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		organizationId: text("organization_id")
			.notNull()
			.unique()
			.references(() => organization.id, {
				onDelete: "cascade",
			}),

		name: text("name").notNull(),

		currency: text("currency").notNull().default("GBP"),
		country: text("country").notNull().default("GB"),

		postcodeArea: text("postcode_area"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("households_organization_id_idx").on(
			table.organizationId,
		),
	],
);