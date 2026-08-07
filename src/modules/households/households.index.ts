import { createRouter } from "@/lib/create-app";
import { requireAuthMiddleware } from "@/middleware/auth.middleware";

import {
	createHouseholdHandler,
	getHouseholdHandler,
	listHouseholdsHandler,
	updateHouseholdHandler,
} from "./households.handlers";
import {
	createHouseholdRoute,
	getHouseholdRoute,
	listHouseholdsRoute,
	updateHouseholdRoute,
} from "./households.routes";

const router = createRouter();

router.use("*", requireAuthMiddleware);

router.openapi(createHouseholdRoute, createHouseholdHandler);

router.openapi(listHouseholdsRoute, listHouseholdsHandler);

router.openapi(getHouseholdRoute, getHouseholdHandler);

router.openapi(updateHouseholdRoute, updateHouseholdHandler);

export default router;
