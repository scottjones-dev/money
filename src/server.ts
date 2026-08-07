import { serve } from "@hono/node-server";

import app from "@/app";
import { env } from "@/env";
import { LOCAL_BASE_URL } from "@/lib/constants";
import { pool } from "@/lib/database";
import { logger } from "@/lib/logger";
import { closeRedis, ensureRedisConnected } from "@/lib/redis";

try {
	await ensureRedisConnected();
} catch (error) {
	logger.warn(
		{ error },
		"Redis unavailable at startup; using insurance limits",
	);
}

const server = serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		const baseUrl = env.PUBLIC_BASE_URL ?? LOCAL_BASE_URL;
		logger.info(
			{
				address: info.address,
				port: info.port,
			},
			`UK Finance API running at ${baseUrl}`,
		);

		logger.info(`OpenAPI document: ${baseUrl}/doc`);
		logger.info(`Scalar reference: ${baseUrl}/reference`);
	},
);

const FORCE_EXIT_AFTER_MS = 10_000;
let shutdownPromise: Promise<void> | undefined;

function shutdown(signal: string): Promise<void> {
	shutdownPromise ??= (async () => {
		logger.info({ signal }, "Shutting down API");

		const forceExitTimer = setTimeout(() => {
			logger.error("Forced shutdown after cleanup timed out");
			process.exit(1);
		}, FORCE_EXIT_AFTER_MS);
		forceExitTimer.unref();

		try {
			await new Promise<void>((resolve) => {
				server.close((error) => {
					if (error) {
						logger.error({ error }, "Failed to close HTTP server");
						process.exitCode = 1;
					}

					resolve();
				});

				if (
					"closeAllConnections" in server &&
					typeof server.closeAllConnections === "function"
				) {
					server.closeAllConnections();
				}
			});

			try {
				await Promise.all([pool.end(), closeRedis()]);
				logger.info("Database and Redis connections closed");
			} catch (error) {
				logger.error(
					{ error },
					"Failed to close database and Redis connections",
				);
				process.exitCode = 1;
			}
		} finally {
			clearTimeout(forceExitTimer);
		}
	})();

	return shutdownPromise;
}

process.once("SIGINT", () => {
	void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
	void shutdown("SIGTERM");
});
