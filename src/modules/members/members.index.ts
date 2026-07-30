import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";

import {
	createMemberHandler,
	deleteMemberHandler,
	getMemberHandler,
	listMembersHandler,
	updateMemberHandler,
} from "./members.handlers";
import {
	createMemberRoute,
	deleteMemberRoute,
	getMemberRoute,
	listMembersRoute,
	updateMemberRoute,
} from "./members.routes";

const router = createRouter();

router.use("*", householdAccessMiddleware);

router.openapi(createMemberRoute, createMemberHandler);
router.openapi(listMembersRoute, listMembersHandler);
router.openapi(getMemberRoute, getMemberHandler);
router.openapi(updateMemberRoute, updateMemberHandler);
router.openapi(deleteMemberRoute, deleteMemberHandler);

export default router;
