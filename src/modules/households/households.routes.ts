import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";

import {
	createHouseholdSchema,
	errorResponseSchema,
	householdIdParamsSchema,
	householdListSchema,
	householdSchema,
} from "./households.schemas";

export const createHouseholdRoute = createRoute({
	method: "post",
	path: "/",
	tags: ["Households"],
	summary: "Create a household",
	description:
		"Creates a Better Auth organization and its linked finance household.",
	request: {
		body: {
			required: true,
			content: {
				"application/json": {
					schema: createHouseholdSchema,
				},
			},
		},
	},
	responses: {
		201: jsonContent(
			householdSchema,
			"Household created successfully",
		),

		401: jsonContent(
			errorResponseSchema,
			"Authentication is required",
		),

		422: jsonContent(
			errorResponseSchema,
			"Request validation failed",
		),
	},
});

export const listHouseholdsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Households"],
	summary: "List accessible households",
	responses: {
		200: jsonContent(
			householdListSchema,
			"Households accessible to the current user",
		),

		401: jsonContent(
			errorResponseSchema,
			"Authentication is required",
		),
	},
});

export const getHouseholdRoute = createRoute({
	method: "get",
	path: "/{householdId}",
	tags: ["Households"],
	summary: "Get a household",
	request: {
		params: householdIdParamsSchema,
	},
	responses: {
		200: jsonContent(
			householdSchema,
			"Requested household",
		),

		401: jsonContent(
			errorResponseSchema,
			"Authentication is required",
		),

		404: jsonContent(
			errorResponseSchema,
			"Household was not found",
		),

		422: jsonContent(
			errorResponseSchema,
			"Request validation failed",
		),
	},
});