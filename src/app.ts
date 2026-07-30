import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import { sessionMiddleware } from "@/middleware/auth.middleware";

import health from "@/modules/health/health.index";
import households from "@/modules/households/households.index";

const app = createApp();

configureOpenAPI(app);

/*
 * Better Auth must be mounted using the raw request handler.
 */
app.on(
	["GET", "POST"],
	"/v1/auth/**",
	(context) => auth.handler(context.req.raw),
);

/*
 * Resolve Better Auth session information for API resources.
 * Better Auth's own routes are already registered above.
 */
app.use("/v1/*", sessionMiddleware);

const routes = app
	.route("/health", health)
	.route("/v1/households", households);

export type AppType = typeof routes;

export default app;