// src/shared/schemas/pagination.schema.ts
import { z } from "@hono/zod-openapi";

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const paginationQuerySchema = z
	.object({
		page: z.coerce
			.number()
			.int()
			.min(1)
			.default(DEFAULT_PAGE)
			.openapi({
				param: {
					name: "page",
					in: "query",
				},
				example: 1,
				description: "Page number, starting from 1.",
			}),

		pageSize: z.coerce
			.number()
			.int()
			.min(1)
			.max(MAX_PAGE_SIZE)
			.default(DEFAULT_PAGE_SIZE)
			.openapi({
				param: {
					name: "pageSize",
					in: "query",
				},
				example: 20,
				description: `Number of records per page. Maximum ${MAX_PAGE_SIZE}.`,
			}),
	})
	.openapi("PaginationQuery");

export const paginationMetaSchema = z
	.object({
		page: z.number().int().min(1),

		pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE),

		totalItems: z.number().int().nonnegative(),

		totalPages: z.number().int().nonnegative(),

		hasPreviousPage: z.boolean(),

		hasNextPage: z.boolean(),
	})
	.openapi("PaginationMeta");

export function createPaginatedResponseSchema<
	TItemSchema extends z.ZodType,
>(itemSchema: TItemSchema, name: string) {
	return z
		.object({
			data: z.array(itemSchema),
			pagination: paginationMetaSchema,
		})
		.openapi(name);
}

export type PaginationQuery = z.infer<
	typeof paginationQuerySchema
>;

export type PaginationMeta = z.infer<
	typeof paginationMetaSchema
>;

export function getPaginationOffset(
	pagination: PaginationQuery,
): number {
	return (pagination.page - 1) * pagination.pageSize;
}

export function createPaginationMeta(input: {
	page: number;
	pageSize: number;
	totalItems: number;
}): PaginationMeta {
	const totalPages =
		input.totalItems === 0
			? 0
			: Math.ceil(input.totalItems / input.pageSize);

	return {
		page: input.page,
		pageSize: input.pageSize,
		totalItems: input.totalItems,
		totalPages,
		hasPreviousPage: input.page > 1,
		hasNextPage:
			totalPages > 0 && input.page < totalPages,
	};
}