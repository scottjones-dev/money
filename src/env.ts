// src/env.ts
import "dotenv/config";

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),

		PORT: z.coerce.number().int().positive().default(9999),

		DATABASE_URL: z.string().min(1),
		DATABASE_SSL: z
			.enum(["true", "false"])
			.default("true")
			.transform((value) => value === "true"),

		BETTER_AUTH_URL: z.url(),
		BETTER_AUTH_SECRET: z.string().min(32),

		ENCRYPTION_KEY: z.string().min(32),

		LOG_LEVEL: z
			.enum(["fatal", "error", "warn", "info", "debug", "trace"])
			.default("info"),
	},

	runtimeEnv: process.env,

	emptyStringAsUndefined: true,
});
