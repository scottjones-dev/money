import Decimal from "decimal.js";
import { membersRepository } from "@/modules/members/members.repository";
import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import {
	createPaginationMeta,
	getPaginationOffset,
} from "@/shared/schemas/pagination.schema";
import type { HouseholdRole } from "@/types/app";
import {
	type Employment,
	type Pension,
	profilesRepository,
} from "./financial-profiles.repository";
import type {
	CreateEmployment,
	CreatePension,
	EmploymentResponse,
	ListEmployment,
	ListPensions,
	PensionResponse,
	UpdateEmployment,
	UpdatePension,
} from "./financial-profiles.schemas";

const money = (v: string) => new Decimal(v).toFixed(2);
const percent = (v?: string | null) =>
	v == null ? null : new Decimal(v).toFixed(4);
const age = (v: string | null) => (v === null ? null : Number(v));
const mapEmployment = (v: Employment): EmploymentResponse => ({
	...v,
	studentLoanPlans:
		v.studentLoanPlans as EmploymentResponse["studentLoanPlans"],
	createdAt: v.createdAt.toISOString(),
	updatedAt: v.updatedAt.toISOString(),
});
const mapPension = (v: Pension): PensionResponse => ({
	...v,
	retirementAge: age(v.retirementAge),
	createdAt: v.createdAt.toISOString(),
	updatedAt: v.updatedAt.toISOString(),
});
const manage = (r: HouseholdRole) => {
	if (r === "viewer")
		throw new AppError({
			code: ERROR_CODES.INSUFFICIENT_HOUSEHOLD_PERMISSION,
			message: "You do not have permission to change financial profiles.",
			statusCode: 403,
		});
};
const member = async (householdId: string, memberId: string) => {
	if (!(await membersRepository.findById({ householdId, memberId })))
		throw new AppError({
			code: ERROR_CODES.HOUSEHOLD_MEMBER_NOT_FOUND,
			message: "The member could not be found.",
			statusCode: 404,
		});
};
const employmentRequired = async (h: string, id: string) => {
	const v = await profilesRepository.findEmployment(h, id);
	if (!v)
		throw new AppError({
			code: ERROR_CODES.RESOURCE_NOT_FOUND,
			message: "The employment profile could not be found.",
			statusCode: 404,
		});
	return v;
};
const pensionRequired = async (h: string, id: string) => {
	const v = await profilesRepository.findPension(h, id);
	if (!v)
		throw new AppError({
			code: ERROR_CODES.RESOURCE_NOT_FOUND,
			message: "The pension could not be found.",
			statusCode: 404,
		});
	return v;
};
export const profilesService = {
	async createEmployment(i: {
		householdId: string;
		role: HouseholdRole;
		data: CreateEmployment;
	}) {
		manage(i.role);
		await member(i.householdId, i.data.memberId);
		return mapEmployment(
			await profilesRepository.createEmployment({
				householdId: i.householdId,
				memberId: i.data.memberId,
				type: i.data.type,
				name: i.data.name,
				grossAnnualIncome: money(i.data.grossAnnualIncome),
				taxCode: i.data.taxCode ?? null,
				niCategory: i.data.niCategory,
				studentLoanPlans: i.data.studentLoanPlans,
				pensionContributionPercent: percent(i.data.pensionContributionPercent),
				isActive: i.data.isActive,
				startDate: i.data.startDate ?? null,
				endDate: i.data.endDate ?? null,
			}),
		);
	},
	async listEmployment(i: { householdId: string; query: ListEmployment }) {
		const f = {
			householdId: i.householdId,
			memberId: i.query.memberId,
			isActive: i.query.isActive,
		};
		const [items, totalItems] = await Promise.all([
			profilesRepository.listEmployment({
				...f,
				limit: i.query.pageSize,
				offset: getPaginationOffset(i.query),
			}),
			profilesRepository.countEmployment(f),
		]);
		return {
			data: items.map(mapEmployment),
			pagination: createPaginationMeta({ ...i.query, totalItems }),
		};
	},
	async getEmployment(h: string, id: string) {
		return mapEmployment(await employmentRequired(h, id));
	},
	async updateEmployment(i: {
		householdId: string;
		id: string;
		role: HouseholdRole;
		data: UpdateEmployment;
	}) {
		manage(i.role);
		await employmentRequired(i.householdId, i.id);
		if (i.data.memberId) await member(i.householdId, i.data.memberId);
		const v = await profilesRepository.updateEmployment(i.householdId, i.id, {
			...i.data,
			...(i.data.grossAnnualIncome
				? { grossAnnualIncome: money(i.data.grossAnnualIncome) }
				: {}),
			...(i.data.pensionContributionPercent !== undefined
				? {
						pensionContributionPercent: percent(
							i.data.pensionContributionPercent,
						),
					}
				: {}),
		});
		if (!v) throw new Error("Employment update failed.");
		return mapEmployment(v);
	},
	async deleteEmployment(h: string, id: string, role: HouseholdRole) {
		manage(role);
		await employmentRequired(h, id);
		await profilesRepository.deleteEmployment(h, id);
		return { success: true as const, deletedId: id };
	},
	async createPension(i: {
		householdId: string;
		role: HouseholdRole;
		data: CreatePension;
	}) {
		manage(i.role);
		await member(i.householdId, i.data.memberId);
		return mapPension(
			await profilesRepository.createPension({
				householdId: i.householdId,
				memberId: i.data.memberId,
				type: i.data.type,
				name: i.data.name,
				currentValue: money(i.data.currentValue),
				personalMonthlyContribution: money(i.data.personalMonthlyContribution),
				employerMonthlyContribution: money(i.data.employerMonthlyContribution),
				retirementAge:
					i.data.retirementAge == null ? null : String(i.data.retirementAge),
				isActive: i.data.isActive,
			}),
		);
	},
	async listPensions(i: { householdId: string; query: ListPensions }) {
		const f = {
			householdId: i.householdId,
			memberId: i.query.memberId,
			isActive: i.query.isActive,
		};
		const [items, totalItems] = await Promise.all([
			profilesRepository.listPensions({
				...f,
				limit: i.query.pageSize,
				offset: getPaginationOffset(i.query),
			}),
			profilesRepository.countPensions(f),
		]);
		return {
			data: items.map(mapPension),
			pagination: createPaginationMeta({ ...i.query, totalItems }),
		};
	},
	async getPension(h: string, id: string) {
		return mapPension(await pensionRequired(h, id));
	},
	async updatePension(i: {
		householdId: string;
		id: string;
		role: HouseholdRole;
		data: UpdatePension;
	}) {
		manage(i.role);
		await pensionRequired(i.householdId, i.id);
		if (i.data.memberId) await member(i.householdId, i.data.memberId);
		const { retirementAge, ...data } = i.data;
		const v = await profilesRepository.updatePension(i.householdId, i.id, {
			...data,
			...(i.data.currentValue
				? { currentValue: money(i.data.currentValue) }
				: {}),
			...(i.data.personalMonthlyContribution
				? {
						personalMonthlyContribution: money(
							i.data.personalMonthlyContribution,
						),
					}
				: {}),
			...(i.data.employerMonthlyContribution
				? {
						employerMonthlyContribution: money(
							i.data.employerMonthlyContribution,
						),
					}
				: {}),
			...(retirementAge !== undefined
				? {
						retirementAge: retirementAge == null ? null : String(retirementAge),
					}
				: {}),
		});
		if (!v) throw new Error("Pension update failed.");
		return mapPension(v);
	},
	async deletePension(h: string, id: string, role: HouseholdRole) {
		manage(role);
		await pensionRequired(h, id);
		await profilesRepository.deletePension(h, id);
		return { success: true as const, deletedId: id };
	},
};
