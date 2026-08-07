import {
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

import { organization } from "./auth.schema";

export const ukNationEnum = pgEnum("uk_nation", [
	"england",
	"scotland",
	"wales",
	"northern_ireland",
]);

export const households = pgTable(
	"households",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, {
				onDelete: "cascade",
			}),

		name: text("name").notNull(),

		currency: text("currency").notNull().default("GBP"),

		country: text("country").notNull().default("GB"),

		nation: ukNationEnum("nation"),

		postcodeArea: text("postcode_area"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [
		uniqueIndex("households_organization_id_unique").on(table.organizationId),

		index("households_created_at_idx").on(table.createdAt),
	],
);

export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;
