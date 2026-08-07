import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
	createEmploymentSchema,
	createPensionSchema,
	deletedProfileSchema,
	employmentList,
	employmentParams,
	employmentSchema,
	errorResponseSchema,
	householdParams,
	listEmploymentQuery,
	listPensionsQuery,
	pensionList,
	pensionParams,
	pensionSchema,
	updateEmploymentSchema,
	updatePensionSchema,
} from "./financial-profiles.schemas";

const e = {
	401: jsonContent(errorResponseSchema, "Authentication is required"),
	404: jsonContent(
		errorResponseSchema,
		"The household, member, or profile was not found",
	),
	422: jsonContent(errorResponseSchema, "Request validation failed"),
};
export const createEmploymentRoute = createRoute({
	operationId: "createEmployment",
	method: "post",
	path: "/employment",
	tags: ["Employment and Payroll"],
	summary: "Create an employment profile",
	description:
		"Creates an employment or self-employment profile used by take-home calculations.",
	request: {
		params: householdParams,
		body: {
			required: true,
			content: { "application/json": { schema: createEmploymentSchema } },
		},
	},
	responses: {
		201: jsonContent(employmentSchema, "Employment created"),
		403: jsonContent(errorResponseSchema, "Management permission is required"),
		...e,
	},
});
export const listEmploymentRoute = createRoute({
	operationId: "listEmployment",
	method: "get",
	path: "/employment",
	tags: ["Employment and Payroll"],
	summary: "List employment profiles",
	description:
		"Lists paginated household employment and self-employment profiles.",
	request: { params: householdParams, query: listEmploymentQuery },
	responses: { 200: jsonContent(employmentList, "Employment list"), ...e },
});
export const getEmploymentRoute = createRoute({
	operationId: "getEmployment",
	method: "get",
	path: "/employment/{employmentId}",
	tags: ["Employment and Payroll"],
	summary: "Get an employment profile",
	description: "Returns an employment profile.",
	request: { params: employmentParams },
	responses: { 200: jsonContent(employmentSchema, "Employment details"), ...e },
});
export const updateEmploymentRoute = createRoute({
	operationId: "updateEmployment",
	method: "patch",
	path: "/employment/{employmentId}",
	tags: ["Employment and Payroll"],
	summary: "Update an employment profile",
	description: "Updates employment facts used by payroll estimates.",
	request: {
		params: employmentParams,
		body: {
			required: true,
			content: { "application/json": { schema: updateEmploymentSchema } },
		},
	},
	responses: {
		200: jsonContent(employmentSchema, "Updated employment"),
		403: jsonContent(errorResponseSchema, "Management permission is required"),
		...e,
	},
});
export const deleteEmploymentRoute = createRoute({
	operationId: "deleteEmployment",
	method: "delete",
	path: "/employment/{employmentId}",
	tags: ["Employment and Payroll"],
	summary: "Delete an employment profile",
	description: "Deletes an employment profile.",
	request: { params: employmentParams },
	responses: {
		200: jsonContent(deletedProfileSchema, "Employment deleted"),
		403: jsonContent(errorResponseSchema, "Management permission is required"),
		...e,
	},
});
export const createPensionRoute = createRoute({
	operationId: "createPension",
	method: "post",
	path: "/pensions",
	tags: ["Pensions"],
	summary: "Create a pension",
	description: "Creates a pension pot or state-pension profile.",
	request: {
		params: householdParams,
		body: {
			required: true,
			content: { "application/json": { schema: createPensionSchema } },
		},
	},
	responses: {
		201: jsonContent(pensionSchema, "Pension created"),
		403: jsonContent(errorResponseSchema, "Management permission is required"),
		...e,
	},
});
export const listPensionsRoute = createRoute({
	operationId: "listPensions",
	method: "get",
	path: "/pensions",
	tags: ["Pensions"],
	summary: "List pensions",
	description: "Lists paginated household pension records.",
	request: { params: householdParams, query: listPensionsQuery },
	responses: { 200: jsonContent(pensionList, "Pension list"), ...e },
});
export const getPensionRoute = createRoute({
	operationId: "getPension",
	method: "get",
	path: "/pensions/{pensionId}",
	tags: ["Pensions"],
	summary: "Get a pension",
	description: "Returns a pension record.",
	request: { params: pensionParams },
	responses: { 200: jsonContent(pensionSchema, "Pension details"), ...e },
});
export const updatePensionRoute = createRoute({
	operationId: "updatePension",
	method: "patch",
	path: "/pensions/{pensionId}",
	tags: ["Pensions"],
	summary: "Update a pension",
	description: "Updates a pension balance or contribution arrangement.",
	request: {
		params: pensionParams,
		body: {
			required: true,
			content: { "application/json": { schema: updatePensionSchema } },
		},
	},
	responses: {
		200: jsonContent(pensionSchema, "Updated pension"),
		403: jsonContent(errorResponseSchema, "Management permission is required"),
		...e,
	},
});
export const deletePensionRoute = createRoute({
	operationId: "deletePension",
	method: "delete",
	path: "/pensions/{pensionId}",
	tags: ["Pensions"],
	summary: "Delete a pension",
	description: "Deletes a pension record.",
	request: { params: pensionParams },
	responses: {
		200: jsonContent(deletedProfileSchema, "Pension deleted"),
		403: jsonContent(errorResponseSchema, "Management permission is required"),
		...e,
	},
});
