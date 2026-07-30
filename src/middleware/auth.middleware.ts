// src/middleware/auth.middleware.ts
import { createMiddleware } from "hono/factory";

import { auth } from "@/lib/auth";
import type { AppBindings } from "@/types/app";

export const sessionMiddleware =
	createMiddleware<AppBindings>(async (context, next) => {
		const authSession = await auth.api.getSession({
			headers: context.req.raw.headers,
		});

		if (!authSession) {
			context.set("user", null);
			context.set("session", null);

			await next();
			return;
		}

		context.set("user", {
			id: authSession.user.id,
			email: authSession.user.email,
			name: authSession.user.name,
		});

		context.set("session", {
			id: authSession.session.id,
			userId: authSession.session.userId,
			expiresAt: authSession.session.expiresAt,
		});

		await next();
	});

export const requireAuthMiddleware =
	createMiddleware<AppBindings>(async (context, next) => {
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
	});