import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth/minimal";
import { organization } from "better-auth/plugins";

import * as authSchema from "@/db/schema/auth.schema";
import { env } from "@/env";
import { db } from "@/lib/database";

export const auth = betterAuth({
	appName: "UK Finance API",

	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,

	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),

	emailAndPassword: {
		enabled: true,
	},

	session: {
		expiresIn: 60 * 60 * 24 * 30,
		updateAge: 60 * 60 * 24,
	},

	plugins: [
		organization({
			allowUserToCreateOrganization: true,
			creatorRole: "owner",
			membershipLimit: 10,
		}),
	],
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;