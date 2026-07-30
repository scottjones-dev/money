import { createMiddleware } from "hono/factory";

import { auth } from "@/lib/auth";
import type { AppBindings } from "@/types/app";

export const sessionMiddleware = createMiddleware<AppBindings>(
	async (context, next) => {
		const authSession = await auth.api.getSession({
			headers: context.req.raw.headers,
		});

		if (!authSession) {
			context.set("user", null);
			context.set("session", null);
			context.set("household", null);

			await next();
			return;
		}

		context.set("user", authSession.user);
		context.set("session", authSession.session);
		context.set("household", null);

		await next();
	},
);

export const requireAuthMiddleware = createMiddleware<AppBindings>(
	async (context, next) => {
		const user = context.get("user");

		if (!user) {
			return context.json(
				{
					error: {
						code: "AUTHENTICATION_REQUIRED",
						message: "Authentication is required.",
						requestId: context.get("requestId"),
					},
				},
				401,
			);
		}

		await next();
	},
);
