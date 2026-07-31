import { createRoute } from "@hono/zod-openapi";

import {
	createExpenseSchema,
	deleteExpenseResponseSchema,
	expenseErrorResponseSchema,
	expenseIdParamsSchema,
	expenseListResponseSchema,
	expenseResponseSchema,
	householdIdParamsSchema,
	listExpensesQuerySchema,
	updateExpenseSchema,
} from "./expenses.schemas";

const tags = ["Expenses"];

export const createExpenseRoute = createRoute({
	operationId: "createExpense",
	method: "post",
	path: "/",
	tags,
	summary: "Create an expense",

	request: {
		params: householdIdParamsSchema,

		body: {
			required: true,
			content: {
				"application/json": {
					schema: createExpenseSchema,
				},
			},
		},
	},

	responses: {
		201: {
			description: "Expense created successfully.",
			content: {
				"application/json": {
					schema: expenseResponseSchema,
				},
			},
		},

		401: {
			description: "Authentication required.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},

		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Household or member not found.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},

		422: {
			description: "Validation failed.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},
	},
});

export const listExpensesRoute = createRoute({
	operationId: "listExpenses",
	method: "get",
	path: "/",
	tags,
	summary: "List household expenses",

	request: {
		params: householdIdParamsSchema,
		query: listExpensesQuerySchema,
	},

	responses: {
		200: {
			description: "Household expense list.",
			content: {
				"application/json": {
					schema: expenseListResponseSchema,
				},
			},
		},

		401: {
			description: "Authentication required.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Household not found.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},
	},
});

export const getExpenseRoute = createRoute({
	operationId: "getExpense",
	method: "get",
	path: "/{expenseId}",
	tags,
	summary: "Get an expense",

	request: {
		params: expenseIdParamsSchema,
	},

	responses: {
		200: {
			description: "Expense details.",
			content: {
				"application/json": {
					schema: expenseResponseSchema,
				},
			},
		},

		404: {
			description: "Expense not found.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},
	},
});

export const updateExpenseRoute = createRoute({
	operationId: "updateExpense",
	method: "patch",
	path: "/{expenseId}",
	tags,
	summary: "Update an expense",

	request: {
		params: expenseIdParamsSchema,

		body: {
			required: true,
			content: {
				"application/json": {
					schema: updateExpenseSchema,
				},
			},
		},
	},

	responses: {
		200: {
			description: "Expense updated successfully.",
			content: {
				"application/json": {
					schema: expenseResponseSchema,
				},
			},
		},

		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Expense not found.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},

		422: {
			description: "Validation failed.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},
	},
});

export const deleteExpenseRoute = createRoute({
	operationId: "deleteExpense",
	method: "delete",
	path: "/{expenseId}",
	tags,
	summary: "Delete an expense",

	request: {
		params: expenseIdParamsSchema,
	},

	responses: {
		200: {
			description: "Expense deleted successfully.",
			content: {
				"application/json": {
					schema: deleteExpenseResponseSchema,
				},
			},
		},

		403: {
			description: "Insufficient permission.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},

		404: {
			description: "Expense not found.",
			content: {
				"application/json": {
					schema: expenseErrorResponseSchema,
				},
			},
		},
	},
});
