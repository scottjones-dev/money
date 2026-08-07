// src/env.ts
import "dotenv/config";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const parsedEnv = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),

		PORT: z.coerce.number().int().positive().default(9000),

		PUBLIC_BASE_URL: z.url().optional(),
		CORS_ALLOWED_ORIGINS: z.string().optional(),
		REDIS_URL: z.url().optional(),

		DATABASE_URL: z.string().min(1),
		DATABASE_SSL: z
			.enum(["true", "false"])
			.default("true")
			.transform((value) => value === "true"),

		BETTER_AUTH_URL: z.url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		DATA_ENCRYPTION_KEYS: z.string().optional(),
		DATA_ENCRYPTION_CURRENT_KEY_ID: z.string().min(1).default("development"),

		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace"])
			.default("info"),
	},

	runtimeEnv: process.env,

	emptyStringAsUndefined: true,
});

if (parsedEnv.NODE_ENV === "production") {
	const missing = [
		["PUBLIC_BASE_URL", parsedEnv.PUBLIC_BASE_URL],
		["CORS_ALLOWED_ORIGINS", parsedEnv.CORS_ALLOWED_ORIGINS],
		["REDIS_URL", parsedEnv.REDIS_URL],
		["DATA_ENCRYPTION_KEYS", parsedEnv.DATA_ENCRYPTION_KEYS],
	]
		.filter(([, value]) => !value)
		.map(([name]) => name);

	if (missing.length > 0) {
		throw new Error(
			`Missing required production environment variables: ${missing.join(", ")}`,
		);
	}
}

export const env = parsedEnv;
