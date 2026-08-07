import { decryptJson, encryptJson } from "@/lib/encryption";
import { recordsRepository } from "@/modules/financial-records/financial-records.repository";
import type { RecordPayload } from "@/modules/financial-records/financial-records.schemas";
import { householdsRepository } from "@/modules/households/households.repository";
import { membersRepository } from "@/modules/members/members.repository";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import type { HouseholdRole } from "@/types/app";
import { runCalculation } from "./calculation-engine";
import { calculationsRepository } from "./calculations.repository";
import type {
	CalculationInput,
	CalculationOutput,
	CalculationResponse,
	ListCalculations,
} from "./calculations.schemas";

const required = async (h: string, id: string) => {
	const v = await calculationsRepository.find(h, id);
	if (!v)
		throw new AppError({
			code: ERROR_CODES.CALCULATION_NOT_FOUND,
			message: "The calculation could not be found.",
			statusCode: 404,
		});
	return v;
};
const map = (v: Awaited<ReturnType<typeof required>>): CalculationResponse => ({
	id: v.id,
	householdId: v.householdId,
	memberId: v.memberId,
	calculator: v.type as CalculationResponse["calculator"],
	status: v.status,
	ruleSetKey: v.ruleSetKey,
	taxYear: v.taxYear as CalculationResponse["taxYear"],
	name: v.name,
	input:
		v.inputEncrypted && v.encryptionKeyId
			? decryptJson<CalculationInput>({
					keyId: v.encryptionKeyId,
					value: v.inputEncrypted,
				})
			: (v.input as unknown as CalculationInput),
	output:
		v.resultEncrypted && v.encryptionKeyId
			? decryptJson<CalculationOutput>({
					keyId: v.encryptionKeyId,
					value: v.resultEncrypted,
				})
			: null,
	warnings: v.warnings ?? [],
	committedLinks: v.committedLinks ?? [],
	committedAt: v.committedAt?.toISOString() ?? null,
	createdAt: v.createdAt.toISOString(),
	updatedAt: v.updatedAt.toISOString(),
});
const manage = (r: HouseholdRole) => {
	if (r === "viewer")
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message:
				"You do not have permission to create, commit, or delete calculations.",
			statusCode: 403,
		});
};
export const calculationsService = {
	async preview(i: {
		householdId: string;
		calculator: CalculationInput["calculator"];
		role: HouseholdRole;
		data: CalculationInput;
	}) {
		manage(i.role);
		if (i.data.calculator !== i.calculator)
			throw new AppError({
				code: ERROR_CODES.VALIDATION_ERROR,
				message: "The request calculator must match the route calculator.",
				statusCode: 422,
			});
		const household = await householdsRepository.findById(i.householdId);
		if (!household)
			throw new AppError({
				code: ERROR_CODES.HOUSEHOLD_NOT_FOUND,
				message: "The household could not be found.",
				statusCode: 404,
			});
		if (
			!household.nation &&
			["income_tax", "payroll", "childcare", "benefits"].includes(i.calculator)
		)
			throw new AppError({
				code: ERROR_CODES.VALIDATION_ERROR,
				message:
					"Confirm the household nation before running this calculation.",
				statusCode: 422,
				details: [
					{
						field: "nation",
						message:
							"A UK nation is required for jurisdiction-sensitive rules.",
					},
				],
			});
		if (
			i.data.memberId &&
			!(await membersRepository.findById({
				householdId: i.householdId,
				memberId: i.data.memberId,
			}))
		)
			throw new AppError({
				code: ERROR_CODES.HOUSEHOLD_MEMBER_NOT_FOUND,
				message: "The member could not be found.",
				statusCode: 404,
			});
		let storedBenefitFacts = {};
		if (i.data.calculator === "benefits" && i.data.useStoredFacts) {
			const currentFacts = await recordsRepository.findCurrent(
				i.householdId,
				"household_facts",
			);
			if (currentFacts) {
				const payload = decryptJson<RecordPayload>({
					keyId: currentFacts.encryptionKeyId,
					value: currentFacts.payloadEncrypted,
				});
				if (payload.type === "household_facts")
					storedBenefitFacts = {
						existingAwards: payload.existingAwards,
						qualifyingBenefitReceived:
							payload.circumstances.qualifyingBenefitReceived,
						statePensionQualifyingYears:
							payload.circumstances.statePensionQualifyingYears,
					};
			}
		}
		const output = runCalculation(
			i.data,
			household.nation ?? "england",
			storedBenefitFacts,
		);
		const inputEncrypted = encryptJson(i.data);
		const outputEncrypted = encryptJson(output);
		const warnings: Array<{
			code: string;
			message: string;
			severity: "info" | "warning";
		}> = output.assumptions.map((message) => ({
			code: "ASSUMPTION",
			message,
			severity: "info" as const,
		}));
		for (const field of new Set(
			output.items.flatMap((item) => item.missingFacts ?? []),
		))
			warnings.push({
				code: "MISSING_FACT",
				message: `Supply ${field} to improve this assessment.`,
				severity: "warning" as const,
			});
		for (const message of output.benefitAssessment?.conflicts ?? [])
			warnings.push({
				code: "CONFLICTING_SUPPORT",
				message,
				severity: "warning" as const,
			});
		const created = await calculationsRepository.create({
			householdId: i.householdId,
			memberId: i.data.memberId ?? null,
			type: i.calculator,
			status: "completed",
			ruleSetKey: `${i.calculator}-${i.data.taxYear}${
				i.data.calculator === "benefits"
					? `-${i.data.nation ?? household.nation}`
					: ""
			}-v1`,
			taxYear: i.data.taxYear,
			input: { calculator: i.calculator },
			inputEncrypted: inputEncrypted.value,
			result: { type: output.type },
			resultEncrypted: outputEncrypted.value,
			encryptionKeyId: inputEncrypted.keyId,
			warnings,
			name: i.data.name ?? null,
			startedAt: new Date(),
			completedAt: new Date(),
		});
		return map(created);
	},
	async list(i: { householdId: string; query: ListCalculations }) {
		const f = {
			householdId: i.householdId,
			type: i.query.calculator,
			status: i.query.status,
		};
		const [items, totalItems] = await Promise.all([
			calculationsRepository.list({
				...f,
				limit: i.query.pageSize,
				offset: getPaginationOffset(i.query),
			}),
			calculationsRepository.count(f),
		]);
		return {
			data: items.map(map),
			pagination: createPaginationMeta({ ...i.query, totalItems }),
		};
	},
	async get(h: string, id: string) {
		return map(await required(h, id));
	},
	async delete(h: string, id: string, role: HouseholdRole) {
		manage(role);
		await required(h, id);
		await calculationsRepository.softDelete(h, id);
		return { success: true as const, deletedId: id };
	},
	async commit(i: {
		householdId: string;
		calculationId: string;
		role: HouseholdRole;
		userId: string;
	}) {
		manage(i.role);
		const existing = await required(i.householdId, i.calculationId);
		if (
			!existing.inputEncrypted ||
			!existing.resultEncrypted ||
			!existing.encryptionKeyId
		)
			throw new AppError({
				code: ERROR_CODES.CALCULATION_FAILED,
				message:
					"This legacy calculation cannot be committed. Create a new preview first.",
				statusCode: 409,
			});
		const input = decryptJson<CalculationInput>({
			keyId: existing.encryptionKeyId,
			value: existing.inputEncrypted,
		});
		const output = decryptJson<CalculationOutput>({
			keyId: existing.encryptionKeyId,
			value: existing.resultEncrypted,
		});
		let derived: Parameters<typeof calculationsRepository.commit>[0]["derived"];
		if (input.calculator === "benefits") {
			const confirmed = output.items.filter(
				(item) =>
					item.confirmed && item.monthlyAmount && item.monthlyAmount !== "0.00",
			);
			if (confirmed.length > 0 && !existing.memberId)
				throw new AppError({
					code: ERROR_CODES.CALCULATION_FAILED,
					message:
						"A claimant member is required to commit confirmed benefit awards.",
					statusCode: 409,
				});
			derived = confirmed.map((item) => ({
				direction: "income" as const,
				memberId: existing.memberId,
				type: "benefit",
				name: `Calculated ${item.key.replaceAll("_", " ")}`,
				monthlyAmount: item.monthlyAmount ?? "0.00",
				key: item.benefitSchemeKey ?? item.key,
			}));
		}
		if (output.monthlyAmount && existing.memberId) {
			if (input.calculator === "payroll")
				derived = {
					direction: "income",
					memberId: existing.memberId,
					type: "employment",
					name: "Calculated monthly take-home pay",
					monthlyAmount: output.monthlyAmount,
				};
			if (
				input.calculator === "universal_credit" ||
				(input.calculator === "benefits" && !derived)
			)
				derived = {
					direction: "income",
					memberId: existing.memberId,
					type: "benefit",
					name: "Calculated benefit entitlement",
					monthlyAmount: output.monthlyAmount,
				};
			if (input.calculator === "child_maintenance")
				derived = {
					direction: input.perspective === "payer" ? "expense" : "income",
					memberId: existing.memberId,
					type: "maintenance",
					name: "Calculated child maintenance",
					monthlyAmount: output.monthlyAmount,
				};
		}
		const committed = await calculationsRepository.commit({ ...i, derived });
		if (!committed)
			throw new AppError({
				code: ERROR_CODES.CALCULATION_NOT_FOUND,
				message: "The calculation could not be found.",
				statusCode: 404,
			});
		return map(committed);
	},
};
