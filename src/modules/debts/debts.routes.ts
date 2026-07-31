import { createRoute } from "@hono/zod-openapi";

import {
	createDebtSchema,
	debtErrorResponseSchema,
	debtIdParamsSchema,
	debtListResponseSchema,
	debtResponseSchema,
	deleteDebtResponseSchema,
	householdIdParamsSchema,
	listDebtsQuerySchema,
	updateDebtSchema,
} from "./debts.schemas";

const tags = ["Debts"];

export const createDebtRoute = createRoute({
	operationId: "createDebt",
	method: "post",
	path: "/",
	tags,
	summary: "Create a debt",
	request: {
		params: householdIdParamsSchema,
		body: {
			required: true,
			content: {
				"application/json": {
					schema: createDebtSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: "Debt created successfully.",
			content: {
				"application/json": {
					schema: debtResponseSchema,
				},
			},
		},
		401: {
			description: "Authentication required.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Household or member not found.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
		422: {
			description: "Validation failed.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
	},
});

export const listDebtsRoute = createRoute({
	operationId: "listDebts",
	method: "get",
	path: "/",
	tags,
	summary: "List household debts",
	request: {
		params: householdIdParamsSchema,
		query: listDebtsQuerySchema,
	},
	responses: {
		200: {
			description: "Household debt list.",
			content: {
				"application/json": {
					schema: debtListResponseSchema,
				},
			},
		},
		401: {
			description: "Authentication required.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Household not found.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
	},
});

export const getDebtRoute = createRoute({
	operationId: "getDebt",
	method: "get",
	path: "/{debtId}",
	tags,
	summary: "Get a debt",
	request: {
		params: debtIdParamsSchema,
	},
	responses: {
		200: {
			description: "Debt details.",
			content: {
				"application/json": {
					schema: debtResponseSchema,
				},
			},
		},
		404: {
			description: "Debt not found.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
	},
});

export const updateDebtRoute = createRoute({
	operationId: "updateDebt",
	method: "patch",
	path: "/{debtId}",
	tags,
	summary: "Update a debt",
	request: {
		params: debtIdParamsSchema,
		body: {
			required: true,
			content: {
				"application/json": {
					schema: updateDebtSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Debt updated successfully.",
			content: {
				"application/json": {
					schema: debtResponseSchema,
				},
			},
		},
		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Debt not found.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
		422: {
			description: "Validation failed.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
	},
});

export const deleteDebtRoute = createRoute({
	operationId: "deleteDebt",
	method: "delete",
	path: "/{debtId}",
	tags,
	summary: "Delete a debt",
	request: {
		params: debtIdParamsSchema,
	},
	responses: {
		200: {
			description: "Debt deleted successfully.",
			content: {
				"application/json": {
					schema: deleteDebtResponseSchema,
				},
			},
		},
		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
		404: {
			description: "Debt not found.",
			content: {
				"application/json": {
					schema: debtErrorResponseSchema,
				},
			},
		},
	},
});
