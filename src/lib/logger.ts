// src/lib/logger.ts
import pino from "pino";

import { env } from "@/env";

export const logger = pino({
	level: env.LOG_LEVEL,

	transport:
		env.NODE_ENV === "development"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
					},
				}
			: undefined,

	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"password",
			"token",
			"accountReference",
		],
		censor: "[REDACTED]",
	},
});