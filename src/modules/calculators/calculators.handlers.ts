import type { AppRouteHandler } from "@/types/app";
import type {
	incomeTaxRoute,
	nationalInsuranceRoute,
	pensionReliefRoute,
	studentLoanRoute,
	takeHomeRoute,
} from "./calculators.routes";
import {
	calculateIncomeTax,
	calculateNationalInsurance,
	calculatePensionRelief,
	calculateStudentLoan,
	calculateTakeHome,
} from "./calculators.service";

export const incomeTaxHandler: AppRouteHandler<typeof incomeTaxRoute> = (c) =>
	c.json(calculateIncomeTax(c.req.valid("json")), 200);
export const nationalInsuranceHandler: AppRouteHandler<
	typeof nationalInsuranceRoute
> = (c) => c.json(calculateNationalInsurance(c.req.valid("json")), 200);
export const studentLoanHandler: AppRouteHandler<typeof studentLoanRoute> = (
	c,
) => c.json(calculateStudentLoan(c.req.valid("json")), 200);
export const pensionReliefHandler: AppRouteHandler<
	typeof pensionReliefRoute
> = (c) => c.json(calculatePensionRelief(c.req.valid("json")), 200);
export const takeHomeHandler: AppRouteHandler<typeof takeHomeRoute> = (c) =>
	c.json(calculateTakeHome(c.req.valid("json")), 200);
