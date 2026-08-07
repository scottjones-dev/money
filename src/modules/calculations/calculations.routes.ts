import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
	calculationInputSchema,
	calculationList,
	calculationListQuery,
	calculationParams,
	calculationSchema,
	deletedCalculation,
	errorResponseSchema,
	previewParams,
} from "./calculations.schemas";

const e = {
	401: jsonContent(errorResponseSchema, "Authentication is required"),
	404: jsonContent(
		errorResponseSchema,
		"The household, member, or calculation was not found",
	),
	422: jsonContent(
		errorResponseSchema,
		"Required facts are missing or the rule request is invalid",
	),
};
export const previewCalculationRoute = createRoute({
	operationId: "previewHouseholdCalculation",
	method: "post",
	path: "/{calculator}/preview",
	tags: ["Calculations"],
	summary: "Preview and store a household calculation",
	description:
		"Combines the selected versioned rule engine with supplied overrides, stores encrypted inputs and output, and makes no financial-record changes.",
	request: {
		params: previewParams,
		body: {
			required: true,
			content: { "application/json": { schema: calculationInputSchema } },
		},
	},
	responses: {
		201: jsonContent(calculationSchema, "Stored calculation preview"),
		403: jsonContent(
			errorResponseSchema,
			"Calculation management permission is required",
		),
		...e,
	},
});
export const listCalculationsRoute = createRoute({
	operationId: "listHouseholdCalculations",
	method: "get",
	path: "/",
	tags: ["Calculations"],
	summary: "List household calculations",
	description: "Lists retained versioned calculations for the household.",
	request: {
		params: previewParams.pick({ householdId: true }),
		query: calculationListQuery,
	},
	responses: { 200: jsonContent(calculationList, "Calculation history"), ...e },
});
export const getCalculationRoute = createRoute({
	operationId: "getHouseholdCalculation",
	method: "get",
	path: "/{calculationId}",
	tags: ["Calculations"],
	summary: "Get a household calculation",
	description: "Returns and decrypts one stored calculation.",
	request: { params: calculationParams },
	responses: {
		200: jsonContent(calculationSchema, "Calculation details"),
		...e,
	},
});
export const deleteCalculationRoute = createRoute({
	operationId: "deleteHouseholdCalculation",
	method: "delete",
	path: "/{calculationId}",
	tags: ["Calculations"],
	summary: "Delete a household calculation",
	description:
		"Soft-deletes a retained calculation at the household user's request.",
	request: { params: calculationParams },
	responses: {
		200: jsonContent(deletedCalculation, "Calculation deleted"),
		403: jsonContent(
			errorResponseSchema,
			"Calculation management permission is required",
		),
		...e,
	},
});
export const commitCalculationRoute = createRoute({
	operationId: "commitHouseholdCalculation",
	method: "post",
	path: "/{calculationId}/commit",
	tags: ["Calculations"],
	summary: "Commit a calculation",
	description:
		"Idempotently applies an eligible preview to calculation-owned income or expense records without overwriting user-entered records.",
	request: { params: calculationParams },
	responses: {
		200: jsonContent(calculationSchema, "Committed calculation"),
		403: jsonContent(
			errorResponseSchema,
			"Calculation management permission is required",
		),
		409: jsonContent(
			errorResponseSchema,
			"The calculation cannot be committed in its current state",
		),
		...e,
	},
});
