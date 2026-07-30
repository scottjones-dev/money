import { createRouter } from "@/lib/create-app";
import { requireAuthMiddleware } from "@/middleware/auth.middleware";

import {
	createHouseholdHandler,
	getHouseholdHandler,
	listHouseholdsHandler,
} from "./households.handlers";
import {
	createHouseholdRoute,
	getHouseholdRoute,
	listHouseholdsRoute,
} from "./households.routes";

const router = createRouter();

router.use("*", requireAuthMiddleware);

router.openapi(
	createHouseholdRoute,
	createHouseholdHandler,
);

router.openapi(
	listHouseholdsRoute,
	listHouseholdsHandler,
);

router.openapi(
	getHouseholdRoute,
	getHouseholdHandler,
);

export default router;