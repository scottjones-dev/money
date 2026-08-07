import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
	createDebtPaymentSchema,
	debtParamsSchema,
	debtPaymentListSchema,
	debtPaymentSchema,
	deleteDebtPaymentSchema,
	errorResponseSchema,
	listDebtPaymentsQuerySchema,
	paymentParamsSchema,
	updateDebtPaymentSchema,
} from "./debt-payments.schemas";

const e = {
	401: jsonContent(errorResponseSchema, "Authentication is required"),
	404: jsonContent(
		errorResponseSchema,
		"The household, debt, member, or payment was not found",
	),
	422: jsonContent(errorResponseSchema, "Request validation failed"),
};
export const createDebtPaymentRoute = createRoute({
	operationId: "createDebtPayment",
	method: "post",
	path: "/{debtId}/payments",
	tags: ["Debt Payments"],
	summary: "Record a debt payment",
	description:
		"Records an idempotent debt payment and updates the debt balance once when completed.",
	request: {
		params: debtParamsSchema,
		body: {
			required: true,
			content: { "application/json": { schema: createDebtPaymentSchema } },
		},
	},
	responses: {
		201: jsonContent(debtPaymentSchema, "Debt payment recorded"),
		403: jsonContent(
			errorResponseSchema,
			"Payment management permission is required",
		),
		409: jsonContent(
			errorResponseSchema,
			"The idempotency key conflicts with another payment",
		),
		...e,
	},
});
export const listDebtPaymentsRoute = createRoute({
	operationId: "listDebtPayments",
	method: "get",
	path: "/{debtId}/payments",
	tags: ["Debt Payments"],
	summary: "List debt payments",
	description: "Lists paginated recorded payments for a household debt.",
	request: { params: debtParamsSchema, query: listDebtPaymentsQuerySchema },
	responses: {
		200: jsonContent(debtPaymentListSchema, "Debt payment list"),
		...e,
	},
});
export const getDebtPaymentRoute = createRoute({
	operationId: "getDebtPayment",
	method: "get",
	path: "/{debtId}/payments/{paymentId}",
	tags: ["Debt Payments"],
	summary: "Get a debt payment",
	description: "Returns one recorded debt payment.",
	request: { params: paymentParamsSchema },
	responses: {
		200: jsonContent(debtPaymentSchema, "Debt payment details"),
		...e,
	},
});
export const updateDebtPaymentRoute = createRoute({
	operationId: "updateDebtPayment",
	method: "patch",
	path: "/{debtId}/payments/{paymentId}",
	tags: ["Debt Payments"],
	summary: "Update a debt payment",
	description:
		"Updates editable payment metadata; completed financial fields remain immutable.",
	request: {
		params: paymentParamsSchema,
		body: {
			required: true,
			content: { "application/json": { schema: updateDebtPaymentSchema } },
		},
	},
	responses: {
		200: jsonContent(debtPaymentSchema, "Updated debt payment"),
		403: jsonContent(
			errorResponseSchema,
			"Payment management permission is required",
		),
		409: jsonContent(
			errorResponseSchema,
			"A completed payment field is immutable",
		),
		...e,
	},
});
export const deleteDebtPaymentRoute = createRoute({
	operationId: "deleteDebtPayment",
	method: "delete",
	path: "/{debtId}/payments/{paymentId}",
	tags: ["Debt Payments"],
	summary: "Delete a pending debt payment",
	description:
		"Deletes a payment that has not changed the recorded debt balance.",
	request: { params: paymentParamsSchema },
	responses: {
		200: jsonContent(deleteDebtPaymentSchema, "Debt payment deleted"),
		403: jsonContent(
			errorResponseSchema,
			"Payment management permission is required",
		),
		409: jsonContent(
			errorResponseSchema,
			"Completed payments cannot be deleted",
		),
		...e,
	},
});
