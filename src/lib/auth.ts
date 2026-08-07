import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth/minimal";
import { openAPI, organization } from "better-auth/plugins";

import * as authSchema from "@/db/schema/auth.schema";
import { env } from "@/env";
import { db } from "@/lib/database";

const trustedOrigins = (env.BETTER_AUTH_TRUSTED_ORIGINS ?? "alicemoney://")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

export const auth = betterAuth({
	appName: "UK Finance API",

	baseURL: env.BETTER_AUTH_URL,
	basePath: "/v1/auth",
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins,

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
		expo(),
		organization({
			allowUserToCreateOrganization: true,
			creatorRole: "owner",
			membershipLimit: 10,
		}),
		openAPI({
			disableDefaultReference: true,
		}),
	],
});

export type Auth = typeof auth;
export type AuthSession = typeof auth.$Infer.Session;
