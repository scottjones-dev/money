import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";

import {
	errorResponseSchema,
	incomeTaxRequestSchema,
	incomeTaxResponseSchema,
	nationalInsuranceRequestSchema,
	nationalInsuranceResponseSchema,
	pensionReliefRequestSchema,
	pensionReliefResponseSchema,
	studentLoanRequestSchema,
	studentLoanResponseSchema,
	takeHomeRequestSchema,
	takeHomeResponseSchema,
} from "./calculators.schemas";

const responseErrors = {
	422: jsonContent(
		errorResponseSchema,
		"The calculator input or requested rule year is unsupported",
	),
	429: jsonContent(
		errorResponseSchema,
		"The anonymous calculator rate limit was exceeded",
	),
};

function route<T extends Parameters<typeof createRoute>[0]>(config: T) {
	return createRoute({ ...config, security: [] });
}

export const incomeTaxRoute = route({
	operationId: "calculateIncomeTax",
	method: "post",
	path: "/income-tax",
	tags: ["Tax Calculators"],
	summary: "Estimate Income Tax",
	description:
		"Estimates annual non-savings, non-dividend UK Income Tax using the selected nation and tax year.",
	request: {
		body: {
			required: true,
			content: { "application/json": { schema: incomeTaxRequestSchema } },
		},
	},
	responses: {
		200: jsonContent(incomeTaxResponseSchema, "Income Tax estimate"),
		...responseErrors,
	},
});
export const nationalInsuranceRoute = route({
	operationId: "calculateNationalInsurance",
	method: "post",
	path: "/national-insurance",
	tags: ["Tax Calculators"],
	summary: "Estimate National Insurance",
	description:
		"Estimates annual employee Class 1 or self-employed Class 4 National Insurance.",
	request: {
		body: {
			required: true,
			content: {
				"application/json": { schema: nationalInsuranceRequestSchema },
			},
		},
	},
	responses: {
		200: jsonContent(
			nationalInsuranceResponseSchema,
			"National Insurance estimate",
		),
		...responseErrors,
	},
});
export const studentLoanRoute = route({
	operationId: "calculateStudentLoan",
	method: "post",
	path: "/student-loan",
	tags: ["Tax Calculators"],
	summary: "Estimate student-loan deductions",
	description:
		"Estimates annual UK student and postgraduate loan deductions using payroll thresholds.",
	request: {
		body: {
			required: true,
			content: { "application/json": { schema: studentLoanRequestSchema } },
		},
	},
	responses: {
		200: jsonContent(studentLoanResponseSchema, "Student-loan estimate"),
		...responseErrors,
	},
});
export const pensionReliefRoute = route({
	operationId: "calculatePensionRelief",
	method: "post",
	path: "/pension-relief",
	tags: ["Pensions"],
	summary: "Estimate pension contribution relief",
	description:
		"Estimates relief-at-source and additional Income Tax effects for a pension contribution.",
	request: {
		body: {
			required: true,
			content: { "application/json": { schema: pensionReliefRequestSchema } },
		},
	},
	responses: {
		200: jsonContent(pensionReliefResponseSchema, "Pension relief estimate"),
		...responseErrors,
	},
});
export const takeHomeRoute = route({
	operationId: "calculateTakeHomePay",
	method: "post",
	path: "/take-home-pay",
	tags: ["Employment and Payroll"],
	summary: "Estimate take-home pay",
	description:
		"Combines Income Tax, National Insurance, pension contributions, and student-loan deductions into an annualised take-home estimate.",
	request: {
		body: {
			required: true,
			content: { "application/json": { schema: takeHomeRequestSchema } },
		},
	},
	responses: {
		200: jsonContent(takeHomeResponseSchema, "Take-home pay estimate"),
		...responseErrors,
	},
});
