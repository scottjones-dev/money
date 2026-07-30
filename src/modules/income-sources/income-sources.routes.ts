// src/modules/income-sources/income-sources.routes.ts
import { createRoute } from "@hono/zod-openapi";

import {
	createIncomeSourceSchema,
	deleteIncomeSourceResponseSchema,
	householdIdParamsSchema,
	incomeSourceErrorResponseSchema,
	incomeSourceIdParamsSchema,
	incomeSourceListResponseSchema,
	incomeSourceResponseSchema,
	listIncomeSourcesQuerySchema,
	updateIncomeSourceSchema,
} from "./income-sources.schemas";

const tags = ["Income sources"];

export const createIncomeSourceRoute = createRoute({
	method: "post",
	path: "/",
	tags,
	summary: "Create an income source",

	request: {
		params: householdIdParamsSchema,

		body: {
			required: true,
			content: {
				"application/json": {
					schema: createIncomeSourceSchema,
				},
			},
		},
	},

	responses: {
		201: {
			description: "Income source created successfully.",
			content: {
				"application/json": {
					schema: incomeSourceResponseSchema,
				},
			},
		},

		401: {
			description: "Authentication required.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},

		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Household or member not found.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},

		422: {
			description: "Validation failed.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},
	},
});

export const listIncomeSourcesRoute = createRoute({
	method: "get",
	path: "/",
	tags,
	summary: "List household income sources",

	request: {
		params: householdIdParamsSchema,
		query: listIncomeSourcesQuerySchema,
	},

	responses: {
		200: {
			description: "Household income-source list.",
			content: {
				"application/json": {
					schema: incomeSourceListResponseSchema,
				},
			},
		},

		401: {
			description: "Authentication required.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Household not found.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},
	},
});

export const getIncomeSourceRoute = createRoute({
	method: "get",
	path: "/:incomeSourceId",
	tags,
	summary: "Get an income source",

	request: {
		params: incomeSourceIdParamsSchema,
	},

	responses: {
		200: {
			description: "Income-source details.",
			content: {
				"application/json": {
					schema: incomeSourceResponseSchema,
				},
			},
		},

		404: {
			description: "Income source not found.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},
	},
});

export const updateIncomeSourceRoute = createRoute({
	method: "patch",
	path: "/:incomeSourceId",
	tags,
	summary: "Update an income source",

	request: {
		params: incomeSourceIdParamsSchema,

		body: {
			required: true,
			content: {
				"application/json": {
					schema: updateIncomeSourceSchema,
				},
			},
		},
	},

	responses: {
		200: {
			description: "Income source updated successfully.",
			content: {
				"application/json": {
					schema: incomeSourceResponseSchema,
				},
			},
		},

		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Income source not found.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},

		422: {
			description: "Validation failed.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},
	},
});

export const deleteIncomeSourceRoute = createRoute({
	method: "delete",
	path: "/:incomeSourceId",
	tags,
	summary: "Delete an income source",

	request: {
		params: incomeSourceIdParamsSchema,
	},

	responses: {
		200: {
			description: "Income source deleted successfully.",
			content: {
				"application/json": {
					schema: deleteIncomeSourceResponseSchema,
				},
			},
		},

		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Income source not found.",
			content: {
				"application/json": {
					schema: incomeSourceErrorResponseSchema,
				},
			},
		},
	},
});
