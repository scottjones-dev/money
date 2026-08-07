import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";
import type {
	createAssetRoute,
	deleteAssetRoute,
	getAssetRoute,
	listAssetsRoute,
	updateAssetRoute,
} from "./assets.routes";
import { assetsService } from "./assets.service";

const household = (
	c: Parameters<AppRouteHandler<typeof createAssetRoute>>[0],
) => getRequiredHousehold(c.get("household"));
export const createAssetHandler: AppRouteHandler<
	typeof createAssetRoute
> = async (c) => {
	const h = household(c);
	return c.json(
		await assetsService.create({
			householdId: h.id,
			role: h.role,
			data: c.req.valid("json"),
		}),
		201,
	);
};
export const listAssetsHandler: AppRouteHandler<
	typeof listAssetsRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await assetsService.list({
			householdId: h.id,
			query: c.req.valid("query"),
		}),
		200,
	);
};
export const getAssetHandler: AppRouteHandler<typeof getAssetRoute> = async (
	c,
) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await assetsService.get({
			householdId: h.id,
			assetId: c.req.valid("param").assetId,
		}),
		200,
	);
};
export const updateAssetHandler: AppRouteHandler<
	typeof updateAssetRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await assetsService.update({
			householdId: h.id,
			assetId: c.req.valid("param").assetId,
			role: h.role,
			data: c.req.valid("json"),
		}),
		200,
	);
};
export const deleteAssetHandler: AppRouteHandler<
	typeof deleteAssetRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await assetsService.delete({
			householdId: h.id,
			assetId: c.req.valid("param").assetId,
			role: h.role,
		}),
		200,
	);
};
