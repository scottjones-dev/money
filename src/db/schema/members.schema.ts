import {
	boolean,
	date,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import { households } from "./households.schema";

export const householdMemberTypeEnum = pgEnum("household_member_type", [
	"adult",
	"child",
	"non_dependent",
]);

export const householdRelationshipEnum = pgEnum("household_relationship", [
	"self",
	"partner",
	"child",
	"step_child",
	"foster_child",
	"other_dependent",
	"non_dependent",
	"other",
]);

export const employmentStatusEnum = pgEnum("employment_status", [
	"employed",
	"self_employed",
	"unemployed",
	"student",
	"retired",
	"not_working",
	"unknown",
]);

export const householdMembers = pgTable(
	"household_members",
	{
		id: uuid("id").primaryKey().defaultRandom(),

		householdId: uuid("household_id")
			.notNull()
			.references(() => households.id, {
				onDelete: "cascade",
			}),

		authUserId: text("auth_user_id").references(() => user.id, {
			onDelete: "set null",
		}),

		firstName: text("first_name").notNull(),

		lastName: text("last_name"),

		memberType: householdMemberTypeEnum("member_type").notNull(),

		relationship: householdRelationshipEnum("relationship").notNull(),

		dateOfBirth: date("date_of_birth", {
			mode: "string",
		}),

		isClaimant: boolean("is_claimant").notNull().default(false),

		isPartner: boolean("is_partner").notNull().default(false),

		isDependent: boolean("is_dependent").notNull().default(false),

		employmentStatus: employmentStatusEnum("employment_status")
			.notNull()
			.default("unknown"),

		isStudent: boolean("is_student").notNull().default(false),

		hasDisability: boolean("has_disability").notNull().default(false),

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
		index("household_members_household_id_idx").on(table.householdId),

		index("household_members_auth_user_id_idx").on(table.authUserId),

		index("household_members_member_type_idx").on(table.memberType),
	],
);

export type HouseholdMember = typeof householdMembers.$inferSelect;

export type NewHouseholdMember = typeof householdMembers.$inferInsert;
