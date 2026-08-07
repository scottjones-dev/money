import { getRequiredHousehold } from "@/shared/http/required-household";
import type { AppRouteHandler } from "@/types/app";

import type {
	createMemberRoute,
	deleteMemberRoute,
	getMemberRoute,
	listMembersRoute,
	updateMemberRoute,
} from "./members.routes";
import { membersService } from "./members.service";

export const createMemberHandler: AppRouteHandler<
	typeof createMemberRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));
	const data = context.req.valid("json");

	const member = await membersService.create({
		householdId: household.id,
		role: household.role,
		data,
	});

	return context.json(member, 201);
};

export const listMembersHandler: AppRouteHandler<
	typeof listMembersRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));
	const query = context.req.valid("query");

	const members = await membersService.list({
		householdId: household.id,
		query,
	});

	return context.json(members, 200);
};

export const getMemberHandler: AppRouteHandler<typeof getMemberRoute> = async (
	context,
) => {
	const household = getRequiredHousehold(context.get("household"));
	const { memberId } = context.req.valid("param");

	const member = await membersService.get({
		householdId: household.id,
		memberId,
	});

	if (!member) {
		return context.json(
			{
				error: {
					code: "HOUSEHOLD_MEMBER_NOT_FOUND",
					message: "The household member could not be found.",
					requestId: context.get("requestId"),
				},
			},
			404,
		);
	}

	return context.json(member, 200);
};

export const updateMemberHandler: AppRouteHandler<
	typeof updateMemberRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));
	const { memberId } = context.req.valid("param");
	const data = context.req.valid("json");

	const member = await membersService.update({
		householdId: household.id,
		memberId,
		role: household.role,
		data,
	});

	return context.json(member, 200);
};

export const deleteMemberHandler: AppRouteHandler<
	typeof deleteMemberRoute
> = async (context) => {
	const household = getRequiredHousehold(context.get("household"));
	const { memberId } = context.req.valid("param");

	const result = await membersService.delete({
		householdId: household.id,
		memberId,
		role: household.role,
	});

	return context.json(
		{
			success: true as const,
			deletedMemberId: result.deletedMemberId,
		},
		200,
	);
};
