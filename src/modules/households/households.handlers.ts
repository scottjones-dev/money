// src/modules/households/households.handlers.ts
import type { AppRouteHandler } from "@/types/app";

import type {
	createHouseholdRoute,
	getHouseholdRoute,
	listHouseholdsRoute,
} from "./households.routes";
import { householdsService } from "./households.service";

export const createHouseholdHandler: AppRouteHandler<
	typeof createHouseholdRoute
> = async (context) => {
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

	const data = context.req.valid("json");

	const household = await householdsService.create({
		userId: user.id,
		headers: context.req.raw.headers,
		data,
	});

	return context.json(household, 201);
};

export const listHouseholdsHandler: AppRouteHandler<
	typeof listHouseholdsRoute
> = async (context) => {
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

	const households = await householdsService.list(user.id);

	return context.json(households, 200);
};

export const getHouseholdHandler: AppRouteHandler<
	typeof getHouseholdRoute
> = async (context) => {
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

	const { householdId } = context.req.valid("param");

	const household = await householdsService.get({
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

	return context.json(household, 200);
};