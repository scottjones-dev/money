// src/modules/affordability/affordability.routes.ts
import { createRoute } from "@hono/zod-openapi";

import {
	affordabilityErrorResponseSchema,
	affordabilityResponseSchema,
	calculateAffordabilityBodySchema,
	householdAffordabilityParamsSchema,
} from "./affordability.schemas";

const tags = ["Affordability"];

export const calculateAffordabilityRoute = createRoute({
	operationId: "calculateAffordability",
	method: "post",
	path: "/calculate",
	tags,
	summary: "Calculate household affordability",
	description:
		"Calculates household affordability using active income sources, expenses and debts.",

	request: {
		params: householdAffordabilityParamsSchema,

		body: {
			required: true,
			content: {
				"application/json": {
					schema: calculateAffordabilityBodySchema,
				},
			},
		},
	},

	responses: {
		200: {
			description: "Household affordability assessment.",
			content: {
				"application/json": {
					schema: affordabilityResponseSchema,
				},
			},
		},

		401: {
			description: "Authentication required.",
			content: {
				"application/json": {
					schema: affordabilityErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Household not found.",
			content: {
				"application/json": {
					schema: affordabilityErrorResponseSchema,
				},
			},
		},

		422: {
			description: "Validation failed.",
			content: {
				"application/json": {
					schema: affordabilityErrorResponseSchema,
				},
			},
		},
	},
});
