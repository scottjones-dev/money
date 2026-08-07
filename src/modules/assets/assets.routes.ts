import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import {
	assetListSchema,
	assetParamsSchema,
	assetSchema,
	createAssetSchema,
	deleteAssetSchema,
	errorResponseSchema,
	householdParamsSchema,
	listAssetsQuerySchema,
	updateAssetSchema,
} from "./assets.schemas";

const errors = {
	401: jsonContent(errorResponseSchema, "Authentication is required"),
	404: jsonContent(
		errorResponseSchema,
		"The household, member, or asset was not found",
	),
	422: jsonContent(errorResponseSchema, "Request validation failed"),
};
export const createAssetRoute = createRoute({
	operationId: "createAsset",
	method: "post",
	path: "/",
	tags: ["Assets"],
	summary: "Create an asset",
	description:
		"Creates a valued asset owned by the household or one of its members.",
	request: {
		params: householdParamsSchema,
		body: {
			required: true,
			content: { "application/json": { schema: createAssetSchema } },
		},
	},
	responses: {
		201: jsonContent(assetSchema, "Asset created"),
		403: jsonContent(
			errorResponseSchema,
			"Asset management permission is required",
		),
		...errors,
	},
});
export const listAssetsRoute = createRoute({
	operationId: "listAssets",
	method: "get",
	path: "/",
	tags: ["Assets"],
	summary: "List assets",
	description: "Lists paginated household assets.",
	request: { params: householdParamsSchema, query: listAssetsQuerySchema },
	responses: { 200: jsonContent(assetListSchema, "Asset list"), ...errors },
});
export const getAssetRoute = createRoute({
	operationId: "getAsset",
	method: "get",
	path: "/{assetId}",
	tags: ["Assets"],
	summary: "Get an asset",
	description: "Returns a household asset by ID.",
	request: { params: assetParamsSchema },
	responses: { 200: jsonContent(assetSchema, "Asset details"), ...errors },
});
export const updateAssetRoute = createRoute({
	operationId: "updateAsset",
	method: "patch",
	path: "/{assetId}",
	tags: ["Assets"],
	summary: "Update an asset",
	description: "Updates an asset valuation, ownership, or inclusion settings.",
	request: {
		params: assetParamsSchema,
		body: {
			required: true,
			content: { "application/json": { schema: updateAssetSchema } },
		},
	},
	responses: {
		200: jsonContent(assetSchema, "Updated asset"),
		403: jsonContent(
			errorResponseSchema,
			"Asset management permission is required",
		),
		...errors,
	},
});
export const deleteAssetRoute = createRoute({
	operationId: "deleteAsset",
	method: "delete",
	path: "/{assetId}",
	tags: ["Assets"],
	summary: "Delete an asset",
	description: "Permanently removes a household asset.",
	request: { params: assetParamsSchema },
	responses: {
		200: jsonContent(deleteAssetSchema, "Asset deleted"),
		403: jsonContent(
			errorResponseSchema,
			"Asset management permission is required",
		),
		...errors,
	},
});
