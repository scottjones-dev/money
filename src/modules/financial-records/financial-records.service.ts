import { decryptJson, encryptJson } from "@/lib/encryption";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import type { HouseholdRole } from "@/types/app";
import {
	type RecordKind,
	recordsRepository,
} from "./financial-records.repository";
import type {
	CreateRecord,
	ListRecords,
	RecordPayload,
	RecordResponse,
	UpdateRecord,
} from "./financial-records.schemas";

const manage = (r: HouseholdRole) => {
	if (r === "viewer")
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message: "You do not have permission to change this record.",
			statusCode: 403,
		});
};
const required = async (h: string, kind: RecordKind, id: string) => {
	const v = await recordsRepository.find(h, kind, id);
	if (!v)
		throw new AppError({
			code: ERROR_CODES.RESOURCE_NOT_FOUND,
			message: "The financial record could not be found.",
			statusCode: 404,
		});
	return v;
};
const map = (v: Awaited<ReturnType<typeof required>>): RecordResponse => ({
	id: v.id,
	householdId: v.householdId,
	kind: v.kind,
	name: v.name,
	version: Number(v.version),
	payload: decryptJson<RecordPayload>({
		keyId: v.encryptionKeyId,
		value: v.payloadEncrypted,
	}),
	summary: v.summary,
	isCurrent: v.isCurrent,
	createdAt: v.createdAt.toISOString(),
	updatedAt: v.updatedAt.toISOString(),
});
const summary = (p: RecordPayload) =>
	p.type === "budget"
		? {
				period: p.period,
				monthlyIncome: p.monthlyIncome,
				monthlyExpenses: p.monthlyExpenses,
			}
		: p.type === "repayment_plan"
			? { strategy: p.strategy, projectedDebtFreeDate: p.projectedDebtFreeDate }
			: p.type === "assessment"
				? { score: p.score, completeness: p.completeness }
				: {
						existingAwards: p.existingAwards.length,
						childcareArrangements: p.childcare.length,
					};
export const recordsService = {
	async create(i: {
		householdId: string;
		kind: RecordKind;
		role: HouseholdRole;
		data: CreateRecord;
	}) {
		manage(i.role);
		if (i.data.payload.type !== i.kind)
			throw new AppError({
				code: ERROR_CODES.VALIDATION_ERROR,
				message: "Payload type does not match the resource route.",
				statusCode: 422,
			});
		const encrypted = encryptJson(i.data.payload);
		return map(
			await recordsRepository.createVersion({
				householdId: i.householdId,
				kind: i.kind,
				name: i.data.name,
				payloadEncrypted: encrypted.value,
				encryptionKeyId: encrypted.keyId,
				summary: summary(i.data.payload),
			}),
		);
	},
	async list(i: { householdId: string; kind: RecordKind; query: ListRecords }) {
		const [items, totalItems] = await Promise.all([
			recordsRepository.list(
				i.householdId,
				i.kind,
				i.query.includeHistory,
				i.query.pageSize,
				getPaginationOffset(i.query),
			),
			recordsRepository.count(i.householdId, i.kind, i.query.includeHistory),
		]);
		return {
			data: items.map(map),
			pagination: createPaginationMeta({ ...i.query, totalItems }),
		};
	},
	async get(h: string, kind: RecordKind, id: string) {
		return map(await required(h, kind, id));
	},
	async update(i: {
		householdId: string;
		kind: RecordKind;
		id: string;
		role: HouseholdRole;
		data: UpdateRecord;
	}) {
		manage(i.role);
		const previous = await required(i.householdId, i.kind, i.id);
		if (i.data.payload.type !== i.kind)
			throw new AppError({
				code: ERROR_CODES.VALIDATION_ERROR,
				message: "Payload type does not match the resource route.",
				statusCode: 422,
			});
		const encrypted = encryptJson(i.data.payload);
		return map(
			await recordsRepository.createVersion(
				{
					householdId: i.householdId,
					kind: i.kind,
					name: i.data.name ?? previous.name,
					version: String(Number(previous.version) + 1),
					payloadEncrypted: encrypted.value,
					encryptionKeyId: encrypted.keyId,
					summary: summary(i.data.payload),
				},
				previous,
			),
		);
	},
	async delete(h: string, kind: RecordKind, id: string, role: HouseholdRole) {
		manage(role);
		await required(h, kind, id);
		await recordsRepository.delete(h, kind, id);
		return { success: true as const, deletedId: id };
	},
};
