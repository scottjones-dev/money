import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";

import {
	createHouseholdSchema,
	errorResponseSchema,
	householdIdParamsSchema,
	householdListSchema,
	householdSchema,
	listHouseholdsQuerySchema,
	updateHouseholdSchema,
} from "./households.schemas";

export const createHouseholdRoute = createRoute({
	operationId: "createHousehold",
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
		201: jsonContent(householdSchema, "Household created successfully"),

		401: jsonContent(errorResponseSchema, "Authentication is required"),

		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});

export const listHouseholdsRoute = createRoute({
	operationId: "listHouseholds",
	method: "get",
	path: "/",
	tags: ["Households"],
	summary: "List accessible households",
	request: {
		query: listHouseholdsQuerySchema,
	},
	responses: {
		200: jsonContent(
			householdListSchema,
			"Households accessible to the current user",
		),

		401: jsonContent(errorResponseSchema, "Authentication is required"),
	},
});

export const getHouseholdRoute = createRoute({
	operationId: "getHousehold",
	method: "get",
	path: "/{householdId}",
	tags: ["Households"],
	summary: "Get a household",
	request: {
		params: householdIdParamsSchema,
	},
	responses: {
		200: jsonContent(householdSchema, "Requested household"),

		401: jsonContent(errorResponseSchema, "Authentication is required"),

		404: jsonContent(errorResponseSchema, "Household was not found"),

		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});

export const updateHouseholdRoute = createRoute({
	operationId: "updateHousehold",
	method: "patch",
	path: "/{householdId}",
	tags: ["Households"],
	summary: "Update a household",
	description:
		"Updates household identity or confirms the UK nation used by devolved calculators.",
	request: {
		params: householdIdParamsSchema,
		body: {
			required: true,
			content: { "application/json": { schema: updateHouseholdSchema } },
		},
	},
	responses: {
		200: jsonContent(householdSchema, "Updated household"),
		401: jsonContent(errorResponseSchema, "Authentication is required"),
		403: jsonContent(
			errorResponseSchema,
			"Household administration permission is required",
		),
		404: jsonContent(errorResponseSchema, "Household was not found"),
		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});
