import { z } from "@hono/zod-openapi";
import { errorResponseSchema } from "@/shared/schemas/common.schema";
import {
	createPaginatedResponseSchema,
	paginationQuerySchema,
} from "@/shared/schemas/pagination.schema";

export { errorResponseSchema };

const money = z
	.string()
	.regex(/^\d{1,12}(?:\.\d{1,2})?$/)
	.openapi({
		description: "A positive pounds amount encoded as a decimal string.",
		example: "125.00",
	});
export const paymentTypeSchema = z.enum([
	"scheduled",
	"minimum",
	"extra",
	"settlement",
	"refund",
	"adjustment",
]);
export const paymentStatusSchema = z.enum([
	"pending",
	"completed",
	"failed",
	"cancelled",
]);
export const paymentMethodSchema = z.enum([
	"direct_debit",
	"standing_order",
	"bank_transfer",
	"debit_card",
	"cash",
	"salary_deduction",
	"benefit_deduction",
	"other",
]);
export const debtParamsSchema = z.object({
	householdId: z.uuid(),
	debtId: z.uuid(),
});
export const paymentParamsSchema = z.object({
	householdId: z.uuid(),
	debtId: z.uuid(),
	paymentId: z.uuid(),
});
export const createDebtPaymentSchema = z
	.object({
		memberId: z.uuid().nullable().optional(),
		type: paymentTypeSchema.default("scheduled"),
		status: paymentStatusSchema.default("completed"),
		method: paymentMethodSchema.nullable().optional(),
		amount: money,
		paymentDate: z.iso.date(),
		balanceBefore: money.nullable().optional(),
		balanceAfter: money.nullable().optional(),
		reference: z.string().trim().max(200).nullable().optional(),
		idempotencyKey: z.string().trim().min(8).max(100).optional(),
		notes: z.string().trim().max(2000).nullable().optional(),
	})
	.openapi("CreateDebtPayment");
export const updateDebtPaymentSchema = createDebtPaymentSchema
	.omit({ idempotencyKey: true })
	.partial()
	.refine((v) => Object.keys(v).length > 0, {
		message: "At least one field is required.",
	})
	.openapi("UpdateDebtPayment");
export const debtPaymentSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		debtId: z.uuid(),
		memberId: z.uuid().nullable(),
		type: paymentTypeSchema,
		status: paymentStatusSchema,
		method: paymentMethodSchema.nullable(),
		amount: money,
		paymentDate: z.iso.date(),
		balanceBefore: money.nullable(),
		balanceAfter: money.nullable(),
		reference: z.string().nullable(),
		idempotencyKey: z.string().nullable(),
		notes: z.string().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("DebtPayment");
export const listDebtPaymentsQuerySchema = z.object({
	...paginationQuerySchema.shape,
	status: paymentStatusSchema.optional(),
	from: z.iso.date().optional(),
	to: z.iso.date().optional(),
});
export const debtPaymentListSchema = createPaginatedResponseSchema(
	debtPaymentSchema,
	"DebtPaymentList",
);
export const deleteDebtPaymentSchema = z
	.object({ success: z.literal(true), deletedId: z.uuid() })
	.openapi("DeleteDebtPaymentResponse");
export type CreateDebtPaymentInput = z.infer<typeof createDebtPaymentSchema>;
export type UpdateDebtPaymentInput = z.infer<typeof updateDebtPaymentSchema>;
export type ListDebtPaymentsQuery = z.infer<typeof listDebtPaymentsQuerySchema>;
