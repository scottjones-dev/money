import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";

import {
	createHouseholdMemberSchema,
	deleteHouseholdMemberResponseSchema,
	errorResponseSchema,
	householdMemberListSchema,
	householdMemberParamsSchema,
	householdMemberSchema,
	householdParamsSchema,
	updateHouseholdMemberSchema,
} from "./members.schemas";

export const createMemberRoute = createRoute({
	operationId: "createMember",
	method: "post",
	path: "/",
	tags: ["Household members"],
	summary: "Create a financial household member",
	request: {
		params: householdParamsSchema,
		body: {
			required: true,
			content: {
				"application/json": {
					schema: createHouseholdMemberSchema,
				},
			},
		},
	},
	responses: {
		201: jsonContent(householdMemberSchema, "Household member created"),
		401: jsonContent(errorResponseSchema, "Authentication is required"),
		403: jsonContent(errorResponseSchema, "Insufficient household permission"),
		404: jsonContent(errorResponseSchema, "Household not found"),
		409: jsonContent(errorResponseSchema, "Household member conflict"),
		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});

export const listMembersRoute = createRoute({
	operationId: "listMembers",
	method: "get",
	path: "/",
	tags: ["Household members"],
	summary: "List financial household members",
	request: {
		params: householdParamsSchema,
	},
	responses: {
		200: jsonContent(householdMemberListSchema, "Household members"),
		401: jsonContent(errorResponseSchema, "Authentication is required"),
		404: jsonContent(errorResponseSchema, "Household not found"),
		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});

export const getMemberRoute = createRoute({
	operationId: "getMember",
	method: "get",
	path: "/{memberId}",
	tags: ["Household members"],
	summary: "Get a financial household member",
	request: {
		params: householdMemberParamsSchema,
	},
	responses: {
		200: jsonContent(householdMemberSchema, "Household member"),
		401: jsonContent(errorResponseSchema, "Authentication is required"),
		404: jsonContent(errorResponseSchema, "Household member not found"),
		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});

export const updateMemberRoute = createRoute({
	operationId: "updateMember",
	method: "patch",
	path: "/{memberId}",
	tags: ["Household members"],
	summary: "Update a financial household member",
	request: {
		params: householdMemberParamsSchema,
		body: {
			required: true,
			content: {
				"application/json": {
					schema: updateHouseholdMemberSchema,
				},
			},
		},
	},
	responses: {
		200: jsonContent(householdMemberSchema, "Household member updated"),
		401: jsonContent(errorResponseSchema, "Authentication is required"),
		403: jsonContent(errorResponseSchema, "Insufficient household permission"),
		404: jsonContent(errorResponseSchema, "Household member not found"),
		409: jsonContent(errorResponseSchema, "Household member conflict"),
		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});

export const deleteMemberRoute = createRoute({
	operationId: "deleteMember",
	method: "delete",
	path: "/{memberId}",
	tags: ["Household members"],
	summary: "Delete a financial household member",
	request: {
		params: householdMemberParamsSchema,
	},
	responses: {
		200: jsonContent(
			deleteHouseholdMemberResponseSchema,
			"Household member deleted",
		),
		401: jsonContent(errorResponseSchema, "Authentication is required"),
		403: jsonContent(errorResponseSchema, "Insufficient household permission"),
		404: jsonContent(errorResponseSchema, "Household member not found"),
		422: jsonContent(errorResponseSchema, "Request validation failed"),
	},
});
