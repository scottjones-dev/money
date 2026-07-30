// src/app.ts
import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import {
	requireAuthMiddleware,
	sessionMiddleware,
} from "@/middleware/auth.middleware";

import health from "@/modules/health/health.index";

const app = createApp();

configureOpenAPI(app);

app.on(["GET", "POST"], "/v1/auth/**", (context) => {
	return auth.handler(context.req.raw);
});

app.use("/v1/*", sessionMiddleware);

app.get("/v1/me", requireAuthMiddleware, (context) => {
	return context.json({
		user: context.get("user"),
		session: context.get("session"),
	});
});

const routes = app.route("/health", health);

export type AppType = typeof routes;

export default app;