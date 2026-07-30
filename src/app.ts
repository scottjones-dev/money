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
import incomeSources from "@/modules/income-sources/income-sources.index";
import members from "@/modules/members/members.index";

const app = createApp();

configureOpenAPI(app);

/**
 * Better Auth requests are usually unauthenticated, so rate-limit
 * these routes by client IP.
 */
app.use("/v1/auth/*", authenticationRateLimitMiddleware);

app.on(["GET", "POST"], "/v1/auth/**", (context) =>
	auth.handler(context.req.raw),
);

/**
 * Resolve the authenticated session before applying the general API
 * limiter. Authenticated requests can then be limited by user ID.
 */
app.use("/v1/*", sessionMiddleware);
app.use("/v1/*", generalRateLimitMiddleware);

const routes = app
	.route("/health", health)
	.route("/v1/households", households)
	.route("/v1/households/:householdId/members", members)
	.route("/v1/households/:householdId/income-sources", incomeSources);

export type AppType = typeof routes;

export default app;
