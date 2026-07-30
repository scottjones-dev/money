// src/db/schema/assets.schema.ts
import {
	boolean,
	date,
	index,
	numeric,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { households } from "./households.schema";
import { householdMembers } from "./members.schema";

export const assetTypeEnum = pgEnum("asset_type", [
	"cash",
	"current_account",
	"savings_account",
	"investment",
	"pension",
	"property",
	"vehicle",
	"business",
	"valuable",
	"other",
]);

export const assetOwnershipTypeEnum = pgEnum("asset_ownership_type", [
	"individual",
	"joint",
	"household",
]);

export const assets = pgTable(
	"assets",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		/**
		 * Every asset belongs to exactly one household.
		 *
		 * All application queries must filter by householdId to preserve
		 * tenant isolation.
		 */
		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, {
				onDelete: "cascade",
			}),

		/**
		 * Optional individual owner.
		 *
		 * This should normally be supplied when ownershipType is
		 * "individual". Joint and household assets may leave it null.
		 */
		memberId: uuid("member_id").references(() => householdMembers.id, {
			onDelete: "set null",
		}),

		type: assetTypeEnum("type").notNull(),

		ownershipType: assetOwnershipTypeEnum("ownership_type")
			.notNull()
			.default("household"),

		name: text("name").notNull(),

		/**
		 * Current estimated value in pounds.
		 *
		 * Drizzle returns PostgreSQL numeric values as strings, avoiding
		 * floating-point precision loss.
		 */
		currentValue: numeric("current_value", {
			precision: 14,
			scale: 2,
		})
			.notNull()
			.default("0.00"),

		/**
		 * Optional original purchase value or initial balance.
		 */
		purchaseValue: numeric("purchase_value", {
			precision: 14,
			scale: 2,
		}),

		purchaseDate: date("purchase_date", {
			mode: "string",
		}),

		/**
		 * Date on which currentValue was last confirmed.
		 */
		valuationDate: date("valuation_date", {
			mode: "string",
		}),

		/**
		 * Whether the asset could reasonably be converted into spendable
		 * money without a substantial delay or penalty.
		 */
		isLiquid: boolean("is_liquid").notNull().default(false),

		/**
		 * Controls whether this asset contributes to household net-worth
		 * calculations.
		 */
		includeInNetWorth: boolean("include_in_net_worth").notNull().default(true),

		isActive: boolean("is_active").notNull().default(true),

		notes: text("notes"),

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
		index("assets_household_id_idx").on(table.householdId),

		index("assets_member_id_idx").on(table.memberId),

		index("assets_type_idx").on(table.type),

		index("assets_active_idx").on(table.isActive),

		index("assets_household_active_idx").on(table.householdId, table.isActive),
	],
);

export type Asset = typeof assets.$inferSelect;

export type NewAsset = typeof assets.$inferInsert;
