// src/index.ts
import { serve } from "@hono/node-server";

import app from "@/app";
import { env } from "@/env";
import { pool } from "@/lib/database";
import { logger } from "@/lib/logger";

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		logger.info(
			{
				address: info.address,
				port: info.port,
			},
			`UK Finance API running at https://api.alicesystems.co.uk`,
		);

		logger.info(`OpenAPI document: https://api.alicesystems.co.uk/doc`);

		logger.info(`Scalar reference: https://api.alicesystems.co.uk/reference`);
	},
);

async function shutdown(signal: string): Promise<void> {
	logger.info({ signal }, "Shutting down API");

	server.close(async (error) => {
		if (error) {
			logger.error({ error }, "Failed to close HTTP server");
			process.exitCode = 1;
			return;
		}

		try {
			await pool.end();
			logger.info("Database pool closed");
		} catch (error) {
			logger.error({ error }, "Failed to close database pool");

			process.exitCode = 1;
		}
	});
}

process.once("SIGINT", () => {
	void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
	void shutdown("SIGTERM");
});
