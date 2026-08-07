import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import {
	createAssetHandler,
	deleteAssetHandler,
	getAssetHandler,
	listAssetsHandler,
	updateAssetHandler,
} from "./assets.handlers";
import {
	createAssetRoute,
	deleteAssetRoute,
	getAssetRoute,
	listAssetsRoute,
	updateAssetRoute,
} from "./assets.routes";

const router = createRouter();
router.use("*", householdAccessMiddleware);
router.openapi(createAssetRoute, createAssetHandler);
router.openapi(listAssetsRoute, listAssetsHandler);
router.openapi(getAssetRoute, getAssetHandler);
router.openapi(updateAssetRoute, updateAssetHandler);
router.openapi(deleteAssetRoute, deleteAssetHandler);
export default router;
