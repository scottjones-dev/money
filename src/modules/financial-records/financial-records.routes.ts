import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
	createRecordSchema,
	deletedRecord,
	errorResponseSchema,
	financialRecordSchema,
	householdParams,
	recordList,
	recordListQuery,
	recordParams,
	updateRecordSchema,
} from "./financial-records.schemas";

const e = {
	401: jsonContent(errorResponseSchema, "Authentication is required"),
	404: jsonContent(
		errorResponseSchema,
		"The household or financial record was not found",
	),
	422: jsonContent(errorResponseSchema, "Request validation failed"),
};
function routes(base: string, tag: string, prefix: string, noun: string) {
	return {
		create: createRoute({
			operationId: `create${prefix}`,
			method: "post",
			path: base,
			tags: [tag],
			summary: `Create ${noun}`,
			description: `Creates the first encrypted, versioned ${noun} record.`,
			request: {
				params: householdParams,
				body: {
					required: true,
					content: { "application/json": { schema: createRecordSchema } },
				},
			},
			responses: {
				201: jsonContent(financialRecordSchema, `${noun} created`),
				403: jsonContent(
					errorResponseSchema,
					"Management permission is required",
				),
				...e,
			},
		}),
		list: createRoute({
			operationId: `list${prefix}`,
			method: "get",
			path: base,
			tags: [tag],
			summary: `List ${noun} records`,
			description: `Lists current ${noun} records or their complete version history.`,
			request: { params: householdParams, query: recordListQuery },
			responses: { 200: jsonContent(recordList, `${noun} list`), ...e },
		}),
		get: createRoute({
			operationId: `get${prefix}`,
			method: "get",
			path: `${base}/{recordId}`,
			tags: [tag],
			summary: `Get ${noun}`,
			description: `Returns and decrypts one ${noun} version.`,
			request: { params: recordParams },
			responses: {
				200: jsonContent(financialRecordSchema, `${noun} details`),
				...e,
			},
		}),
		update: createRoute({
			operationId: `update${prefix}`,
			method: "patch",
			path: `${base}/{recordId}`,
			tags: [tag],
			summary: `Create a new ${noun} version`,
			description: `Preserves the previous record and creates a new current ${noun} version.`,
			request: {
				params: recordParams,
				body: {
					required: true,
					content: { "application/json": { schema: updateRecordSchema } },
				},
			},
			responses: {
				200: jsonContent(financialRecordSchema, `Updated ${noun} version`),
				403: jsonContent(
					errorResponseSchema,
					"Management permission is required",
				),
				...e,
			},
		}),
		delete: createRoute({
			operationId: `delete${prefix}`,
			method: "delete",
			path: `${base}/{recordId}`,
			tags: [tag],
			summary: `Delete ${noun}`,
			description: `Deletes the selected ${noun} version at the user's request.`,
			request: { params: recordParams },
			responses: {
				200: jsonContent(deletedRecord, `${noun} deleted`),
				403: jsonContent(
					errorResponseSchema,
					"Management permission is required",
				),
				...e,
			},
		}),
	};
}
export const factsRoutes = routes(
	"/facts",
	"Household Facts",
	"HouseholdFacts",
	"household facts",
);
export const budgetRoutes = routes("/budgets", "Budgeting", "Budget", "budget");
export const repaymentRoutes = routes(
	"/repayment-plans",
	"Repayment Plans",
	"RepaymentPlan",
	"repayment plan",
);
export const assessmentRoutes = routes(
	"/assessments",
	"Assessments",
	"Assessment",
	"financial assessment",
);
