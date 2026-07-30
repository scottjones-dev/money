import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import { sessionMiddleware } from "@/middleware/auth.middleware";
import {
	authenticationRateLimitMiddleware,
	generalRateLimitMiddleware,
} from "@/middleware/rate-limit.middleware";

import health from "@/modules/health/health.index";
import households from "@/modules/households/households.index";
import members from "@/modules/members/members.index";

const app = createApp();

configureOpenAPI(app);

/*
 * Better Auth routes are limited by IP because the user will often not
 * have an authenticated session yet.
 */
app.use(
	"/v1/auth/*",
	authenticationRateLimitMiddleware,
);

app.on(
	["GET", "POST"],
	"/v1/auth/**",
	(context) => auth.handler(context.req.raw),
);

/*
 * Resolve sessions before the general limiter so authenticated requests
 * can be limited by user ID instead of only by IP.
 */
app.use("/v1/*", sessionMiddleware);
app.use("/v1/*", generalRateLimitMiddleware);

const routes = app
	.route("/health", health)
	.route("/v1/households", households)
	.route(
		"/v1/households/:householdId/members",
		members,
	);

export type AppType = typeof routes;

export default app;