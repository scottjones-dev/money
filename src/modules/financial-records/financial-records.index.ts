import { createRouter } from "@/lib/create-app";
import { householdAccessMiddleware } from "@/middleware/household-access.middleware";
import { getRequiredHousehold } from "@/shared/http/required-household";
import type { RecordKind } from "./financial-records.repository";
import {
	assessmentRoutes,
	budgetRoutes,
	factsRoutes,
	repaymentRoutes,
} from "./financial-records.routes";
import { recordsService } from "./financial-records.service";

const router = createRouter();
router.use("*", householdAccessMiddleware);
function mount(r: typeof factsRoutes, kind: RecordKind) {
	router.openapi(r.create, async (c) => {
		const h = getRequiredHousehold(c.get("household"));
		return c.json(
			await recordsService.create({
				householdId: h.id,
				kind,
				role: h.role,
				data: c.req.valid("json"),
			}),
			201,
		);
	});
	router.openapi(r.list, async (c) => {
		const h = getRequiredHousehold(c.get("household"));
		return c.json(
			await recordsService.list({
				householdId: h.id,
				kind,
				query: c.req.valid("query"),
			}),
			200,
		);
	});
	router.openapi(r.get, async (c) => {
		const h = getRequiredHousehold(c.get("household"));
		return c.json(
			await recordsService.get(h.id, kind, c.req.valid("param").recordId),
			200,
		);
	});
	router.openapi(r.update, async (c) => {
		const h = getRequiredHousehold(c.get("household"));
		return c.json(
			await recordsService.update({
				householdId: h.id,
				kind,
				id: c.req.valid("param").recordId,
				role: h.role,
				data: c.req.valid("json"),
			}),
			200,
		);
	});
	router.openapi(r.delete, async (c) => {
		const h = getRequiredHousehold(c.get("household"));
		return c.json(
			await recordsService.delete(
				h.id,
				kind,
				c.req.valid("param").recordId,
				h.role,
			),
			200,
		);
	});
}
mount(factsRoutes, "household_facts");
mount(budgetRoutes, "budget");
mount(repaymentRoutes, "repayment_plan");
mount(assessmentRoutes, "assessment");
export default router;
