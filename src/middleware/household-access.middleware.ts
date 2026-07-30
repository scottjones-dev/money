import { createMiddleware } from "hono/factory";

import { householdsRepository } from "@/modules/households/households.repository";
import type { AppBindings } from "@/types/app";

export const householdAccessMiddleware =
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

		const householdId = context.req.param("householdId");

		if (!householdId) {
			return context.json(
				{
					error: {
						code: "HOUSEHOLD_ID_REQUIRED",
						message: "A household ID is required.",
						requestId: context.get("requestId"),
					},
				},
				400,
			);
		}

		const household =
			await householdsRepository.findMembership({
				userId: user.id,
				householdId,
			});

		if (!household) {
			return context.json(
				{
					error: {
						code: "HOUSEHOLD_NOT_FOUND",
						message: "The household could not be found.",
						requestId: context.get("requestId"),
					},
				},
				404,
			);
		}

		context.set("household", household);

		await next();
	});