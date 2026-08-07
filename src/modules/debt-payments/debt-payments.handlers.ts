import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";
import type {
	createDebtPaymentRoute,
	deleteDebtPaymentRoute,
	getDebtPaymentRoute,
	listDebtPaymentsRoute,
	updateDebtPaymentRoute,
} from "./debt-payments.routes";
import { debtPaymentsService } from "./debt-payments.service";
export const createDebtPaymentHandler: AppRouteHandler<
	typeof createDebtPaymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	const p = c.req.valid("param");
	return c.json(
		await debtPaymentsService.create({
			householdId: h.id,
			debtId: p.debtId,
			role: h.role,
			data: c.req.valid("json"),
		}),
		201,
	);
};
export const listDebtPaymentsHandler: AppRouteHandler<
	typeof listDebtPaymentsRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	return c.json(
		await debtPaymentsService.list({
			householdId: h.id,
			debtId: c.req.valid("param").debtId,
			query: c.req.valid("query"),
		}),
		200,
	);
};
export const getDebtPaymentHandler: AppRouteHandler<
	typeof getDebtPaymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	const p = c.req.valid("param");
	return c.json(
		await debtPaymentsService.get({
			householdId: h.id,
			debtId: p.debtId,
			paymentId: p.paymentId,
		}),
		200,
	);
};
export const updateDebtPaymentHandler: AppRouteHandler<
	typeof updateDebtPaymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	const p = c.req.valid("param");
	return c.json(
		await debtPaymentsService.update({
			householdId: h.id,
			debtId: p.debtId,
			paymentId: p.paymentId,
			role: h.role,
			data: c.req.valid("json"),
		}),
		200,
	);
};
export const deleteDebtPaymentHandler: AppRouteHandler<
	typeof deleteDebtPaymentRoute
> = async (c) => {
	const h = getRequiredHousehold(c.get("household"));
	const p = c.req.valid("param");
	return c.json(
		await debtPaymentsService.delete({
			householdId: h.id,
			debtId: p.debtId,
			paymentId: p.paymentId,
			role: h.role,
		}),
		200,
	);
};
