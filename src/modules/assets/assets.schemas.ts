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
		description: "A non-negative pounds amount encoded as a decimal string.",
		example: "15000.00",
	});
export const assetTypeSchema = z.enum([
	"cash",
	"current_account",
	"savings_account",
	"investment",
	"pension",
	"property",
	"vehicle",
	"business",
	"valuable",
	"other",
]);
export const assetOwnershipSchema = z.enum([
	"individual",
	"joint",
	"household",
]);
export const householdParamsSchema = z.object({ householdId: z.uuid() });
export const assetParamsSchema = z.object({
	householdId: z.uuid(),
	assetId: z.uuid(),
});
export const createAssetSchema = z
	.object({
		memberId: z.uuid().nullable().optional(),
		type: assetTypeSchema,
		ownershipType: assetOwnershipSchema.default("household"),
		name: z.string().trim().min(1).max(200),
		currentValue: money,
		purchaseValue: money.nullable().optional(),
		purchaseDate: z.iso.date().nullable().optional(),
		valuationDate: z.iso.date().nullable().optional(),
		isLiquid: z.boolean().default(false),
		includeInNetWorth: z.boolean().default(true),
		isActive: z.boolean().default(true),
		notes: z.string().trim().max(2000).nullable().optional(),
	})
	.openapi("CreateAsset");
export const updateAssetSchema = createAssetSchema
	.partial()
	.refine((v) => Object.keys(v).length > 0, {
		message: "At least one field is required.",
	})
	.openapi("UpdateAsset");
export const assetSchema = z
	.object({
		id: z.uuid(),
		householdId: z.uuid(),
		memberId: z.uuid().nullable(),
		type: assetTypeSchema,
		ownershipType: assetOwnershipSchema,
		name: z.string(),
		currentValue: money,
		purchaseValue: money.nullable(),
		purchaseDate: z.iso.date().nullable(),
		valuationDate: z.iso.date().nullable(),
		isLiquid: z.boolean(),
		includeInNetWorth: z.boolean(),
		isActive: z.boolean(),
		notes: z.string().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("Asset");
export const assetListSchema = createPaginatedResponseSchema(
	assetSchema,
	"AssetList",
);
export const listAssetsQuerySchema = z.object({
	...paginationQuerySchema.shape,
	type: assetTypeSchema.optional(),
	memberId: z.uuid().optional(),
	isActive: z
		.enum(["true", "false"])
		.transform((v) => v === "true")
		.optional(),
});
export const deleteAssetSchema = z
	.object({ success: z.literal(true), deletedId: z.uuid() })
	.openapi("DeleteAssetResponse");
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
export type AssetResponse = z.infer<typeof assetSchema>;
