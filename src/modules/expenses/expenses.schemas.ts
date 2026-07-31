import { z } from "@hono/zod-openapi";

const moneyAmountSchema = z
	.string()
	.trim()
	.regex(/^\d{1,12}(?:\.\d{1,2})?$/, {
		message:
			"Amount must be zero or greater with no more than two decimal places.",
	})
	.openapi({
		example: "850.00",
	});

export const expenseCategorySchema = z.enum([
	"housing",
	"council_tax",
	"utilities",
	"food",
	"transport",
	"insurance",
	"childcare",
	"healthcare",
	"education",
	"communications",
	"subscriptions",
	"clothing",
	"personal_care",
	"entertainment",
	"pets",
	"maintenance",
	"family_support",
	"savings",
	"debt_payment",
	"tax",
	"other",
]);

export const expensePrioritySchema = z.enum([
	"essential",
	"important",
	"discretionary",
]);

export const expenseFrequencySchema = z.enum([
	"weekly",
	"fortnightly",
	"four_weekly",
	"monthly",
	"quarterly",
	"half_yearly",
	"yearly",
	"one_off",
]);

export const expensePaymentMethodSchema = z.enum([
	"direct_debit",
	"standing_order",
	"bank_transfer",
	"debit_card",
	"credit_card",
	"cash",
	"salary_deduction",
	"benefit_deduction",
	"other",
]);

const paymentDueDaySchema = z.coerce.number().int().min(1).max(31);

export const householdIdParamsSchema = z.object({
	householdId: z.uuid(),
});

export const expenseIdParamsSchema = z.object({
	householdId: z.uuid(),
	expenseId: z.uuid(),
});

export const createExpenseSchema = z
	.object({
		memberId: z.uuid().nullable().optional(),

		category: expenseCategorySchema,

		priority: expensePrioritySchema.default("important"),

		name: z.string().trim().min(1).max(200),

		amount: moneyAmountSchema,

		frequency: expenseFrequencySchema,

		paymentMethod: expensePaymentMethodSchema.nullable().optional(),

		paymentDueDay: paymentDueDaySchema.nullable().optional(),

		startDate: z.iso.date().nullable().optional(),

		endDate: z.iso.date().nullable().optional(),

		isActive: z.boolean().default(true),

		isFixed: z.boolean().default(false),

		isHouseholdExpense: z.boolean().default(true),

		includeInBudget: z.boolean().default(true),

		payee: z.string().trim().max(200).nullable().optional(),

		notes: z.string().trim().max(2_000).nullable().optional(),
	})
	.openapi("CreateExpense");

export const updateExpenseSchema = z
	.object({
		memberId: z.uuid().nullable().optional(),

		category: expenseCategorySchema.optional(),

		priority: expensePrioritySchema.optional(),

		name: z.string().trim().min(1).max(200).optional(),

		amount: moneyAmountSchema.optional(),

		frequency: expenseFrequencySchema.optional(),

		paymentMethod: expensePaymentMethodSchema.nullable().optional(),

		paymentDueDay: paymentDueDaySchema.nullable().optional(),

		startDate: z.iso.date().nullable().optional(),

		endDate: z.iso.date().nullable().optional(),

		isActive: z.boolean().optional(),

		isFixed: z.boolean().optional(),

		isHouseholdExpense: z.boolean().optional(),

		includeInBudget: z.boolean().optional(),

		payee: z.string().trim().max(200).nullable().optional(),

		notes: z.string().trim().max(2_000).nullable().optional(),
	})
	.refine((value) => Object.keys(value).length > 0, {
		message: "At least one expense field must be supplied.",
	})
	.openapi("UpdateExpense");

export const listExpensesQuerySchema = z.object({
	memberId: z.uuid().optional(),

	category: expenseCategorySchema.optional(),

	priority: expensePrioritySchema.optional(),

	isActive: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),

	includeInBudget: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),

	page: z.coerce.number().int().min(1).default(1),

	pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const normalisedExpenseSchema = z.object({
	weekly: z.string(),
	monthly: z.string(),
	yearly: z.string(),
});

export const expenseResponseSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		memberId: z.uuid().nullable(),
		category: expenseCategorySchema,
		priority: expensePrioritySchema,
		name: z.string(),
		amount: z.string(),
		frequency: expenseFrequencySchema,
		paymentMethod: expensePaymentMethodSchema.nullable(),
		paymentDueDay: z.number().int().nullable(),
		startDate: z.string().nullable(),
		endDate: z.string().nullable(),
		isActive: z.boolean(),
		isFixed: z.boolean(),
		isHouseholdExpense: z.boolean(),
		includeInBudget: z.boolean(),
		payee: z.string().nullable(),
		notes: z.string().nullable(),
		normalised: normalisedExpenseSchema.nullable(),
		createdAt: z.string(),
		updatedAt: z.string(),
	})
	.openapi("Expense");

export const expenseListResponseSchema = z
	.object({
		items: z.array(expenseResponseSchema),

		meta: z.object({
			page: z.number().int(),
			pageSize: z.number().int(),
			total: z.number().int(),
			totalPages: z.number().int(),
		}),
	})
	.openapi("ExpenseList");

export const deleteExpenseResponseSchema = z.object({
	success: z.literal(true),
});

export const expenseErrorResponseSchema = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		requestId: z.string(),
		details: z
			.array(
				z.object({
					field: z.string().optional(),
					message: z.string(),
				}),
			)
			.optional(),
	}),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;
