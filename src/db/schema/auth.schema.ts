import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable(
	"user",
	{
		id: text("id").primaryKey(),

		name: text("name").notNull(),

		email: text("email").notNull(),

		emailVerified: boolean("email_verified").default(false).notNull(),

		image: text("image"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [uniqueIndex("user_email_uidx").on(table.email)],
);

export const session = pgTable(
	"session",
	{
		id: text("id").primaryKey(),

		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),

		token: text("token").notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),

		ipAddress: text("ip_address"),

		userAgent: text("user_agent"),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, {
				onDelete: "cascade",
			}),

		activeOrganizationId: text("active_organization_id"),
	},
	(table) => [
		uniqueIndex("session_token_uidx").on(table.token),

		index("session_user_id_idx").on(table.userId),

		index("session_expires_at_idx").on(table.expiresAt),

		index("session_active_organization_id_idx").on(table.activeOrganizationId),
	],
);

export const account = pgTable(
	"account",
	{
		id: text("id").primaryKey(),

		accountId: text("account_id").notNull(),

		providerId: text("provider_id").notNull(),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, {
				onDelete: "cascade",
			}),

		accessToken: text("access_token"),

		refreshToken: text("refresh_token"),

		idToken: text("id_token"),

		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
			mode: "date",
		}),

		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
			mode: "date",
		}),

		scope: text("scope"),

		password: text("password"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),

		uniqueIndex("account_provider_account_uidx").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id").primaryKey(),

		identifier: text("identifier").notNull(),

		value: text("value").notNull(),

		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),

		updatedAt: timestamp("updated_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("verification_identifier_idx").on(table.identifier),

		index("verification_expires_at_idx").on(table.expiresAt),
	],
);

export const organization = pgTable(
	"organization",
	{
		id: text("id").primaryKey(),

		name: text("name").notNull(),

		slug: text("slug").notNull(),

		logo: text("logo"),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),

		metadata: text("metadata"),
	},
	(table) => [uniqueIndex("organization_slug_uidx").on(table.slug)],
);

export const member = pgTable(
	"member",
	{
		id: text("id").primaryKey(),

		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, {
				onDelete: "cascade",
			}),

		userId: text("user_id")
			.notNull()
			.references(() => user.id, {
				onDelete: "cascade",
			}),

		role: text("role").default("member").notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("member_organization_id_idx").on(table.organizationId),

		index("member_user_id_idx").on(table.userId),

		uniqueIndex("member_organization_user_uidx").on(
			table.organizationId,
			table.userId,
		),
	],
);

export const invitation = pgTable(
	"invitation",
	{
		id: text("id").primaryKey(),

		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, {
				onDelete: "cascade",
			}),

		email: text("email").notNull(),

		role: text("role"),

		status: text("status").default("pending").notNull(),

		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),

		createdAt: timestamp("created_at", {
			withTimezone: true,
			mode: "date",
		})
			.defaultNow()
			.notNull(),

		inviterId: text("inviter_id")
			.notNull()
			.references(() => user.id, {
				onDelete: "cascade",
			}),
	},
	(table) => [
		index("invitation_organization_id_idx").on(table.organizationId),

		index("invitation_email_idx").on(table.email),

		index("invitation_expires_at_idx").on(table.expiresAt),

		index("invitation_status_idx").on(table.status),
	],
);

export type AuthUser = typeof user.$inferSelect;
export type NewAuthUser = typeof user.$inferInsert;

export type AuthSession = typeof session.$inferSelect;
export type NewAuthSession = typeof session.$inferInsert;

export type AuthAccount = typeof account.$inferSelect;
export type NewAuthAccount = typeof account.$inferInsert;

export type AuthOrganization = typeof organization.$inferSelect;

export type AuthOrganizationMember = typeof member.$inferSelect;

export type AuthInvitation = typeof invitation.$inferSelect;
