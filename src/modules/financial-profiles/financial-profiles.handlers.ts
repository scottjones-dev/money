import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";
import type {
	createEmploymentRoute,
	createPensionRoute,
	deleteEmploymentRoute,
	deletePensionRoute,
	getEmploymentRoute,
	getPensionRoute,
	listEmploymentRoute,
	listPensionsRoute,
	updateEmploymentRoute,
	updatePensionRoute,
} from "./financial-profiles.routes";
import { profilesService } from "./financial-profiles.service";
export const createEmploymentHandler: AppRouteHandler<
	typeof createEmploymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.createEmployment({
			householdId: h.id,
			role: h.role,
			data: c.req.valid("json"),
		}),
		201,
	);
};
export const listEmploymentHandler: AppRouteHandler<
	typeof listEmploymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.listEmployment({
			householdId: h.id,
			query: c.req.valid("query"),
		}),
		200,
	);
};
export const getEmploymentHandler: AppRouteHandler<
	typeof getEmploymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.getEmployment(
			h.id,
			c.req.valid("param").employmentId,
		),
		200,
	);
};
export const updateEmploymentHandler: AppRouteHandler<
	typeof updateEmploymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.updateEmployment({
			householdId: h.id,
			id: c.req.valid("param").employmentId,
			role: h.role,
			data: c.req.valid("json"),
		}),
		200,
	);
};
export const deleteEmploymentHandler: AppRouteHandler<
	typeof deleteEmploymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.deleteEmployment(
			h.id,
			c.req.valid("param").employmentId,
			h.role,
		),
		200,
	);
};
export const createPensionHandler: AppRouteHandler<
	typeof createPensionRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.createPension({
			householdId: h.id,
			role: h.role,
			data: c.req.valid("json"),
		}),
		201,
	);
};
export const listPensionsHandler: AppRouteHandler<
	typeof listPensionsRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.listPensions({
			householdId: h.id,
			query: c.req.valid("query"),
		}),
		200,
	);
};
export const getPensionHandler: AppRouteHandler<
	typeof getPensionRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.getPension(h.id, c.req.valid("param").pensionId),
		200,
	);
};
export const updatePensionHandler: AppRouteHandler<
	typeof updatePensionRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.updatePension({
			householdId: h.id,
			id: c.req.valid("param").pensionId,
			role: h.role,
			data: c.req.valid("json"),
		}),
		200,
	);
};
export const deletePensionHandler: AppRouteHandler<
	typeof deletePensionRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await profilesService.deletePension(
			h.id,
			c.req.valid("param").pensionId,
			h.role,
		),
		200,
	);
};
