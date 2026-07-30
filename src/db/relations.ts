import { defineRelations } from "drizzle-orm";

import * as schema from "@/db/schema";

export const relations = defineRelations(schema, (relations) => ({
	user: {
		sessions: relations.many.session(),
		accounts: relations.many.account(),
		organizationMemberships: relations.many.member(),
		sentInvitations: relations.many.invitation(),
		householdMembers: relations.many.householdMembers(),
	},

	session: {
		user: relations.one.user({
			from: relations.session.userId,
			to: relations.user.id,
		}),
	},

	account: {
		user: relations.one.user({
			from: relations.account.userId,
			to: relations.user.id,
		}),
	},

	organization: {
		members: relations.many.member(),
		invitations: relations.many.invitation(),
		household: relations.one.households(),
	},

	member: {
		organization: relations.one.organization({
			from: relations.member.organizationId,
			to: relations.organization.id,
		}),

		user: relations.one.user({
			from: relations.member.userId,
			to: relations.user.id,
		}),
	},

	invitation: {
		organization: relations.one.organization({
			from: relations.invitation.organizationId,
			to: relations.organization.id,
		}),

		inviter: relations.one.user({
			from: relations.invitation.inviterId,
			to: relations.user.id,
		}),
	},

	households: {
		organization: relations.one.organization({
			from: relations.households.organizationId,
			to: relations.organization.id,
		}),

		members: relations.many.householdMembers(),
		incomeSources: relations.many.incomeSources(),
		expenses: relations.many.expenses(),
		debts: relations.many.debts(),
		debtPayments: relations.many.debtPayments(),
		assets: relations.many.assets(),
		calculations: relations.many.calculations(),
	},

	householdMembers: {
		household: relations.one.households({
			from: relations.householdMembers.householdId,
			to: relations.households.id,
		}),

		authUser: relations.one.user({
			from: relations.householdMembers.authUserId,
			to: relations.user.id,
		}),

		incomeSources: relations.many.incomeSources(),
		expenses: relations.many.expenses(),
		debts: relations.many.debts(),
		debtPayments: relations.many.debtPayments(),
		assets: relations.many.assets(),
		calculations: relations.many.calculations(),
	},

	incomeSources: {
		household: relations.one.households({
			from: relations.incomeSources.householdId,
			to: relations.households.id,
		}),

		member: relations.one.householdMembers({
			from: relations.incomeSources.memberId,
			to: relations.householdMembers.id,
		}),
	},

	expenses: {
		household: relations.one.households({
			from: relations.expenses.householdId,
			to: relations.households.id,
		}),

		member: relations.one.householdMembers({
			from: relations.expenses.memberId,
			to: relations.householdMembers.id,
		}),
	},

	debts: {
		household: relations.one.households({
			from: relations.debts.householdId,
			to: relations.households.id,
		}),

		member: relations.one.householdMembers({
			from: relations.debts.memberId,
			to: relations.householdMembers.id,
		}),

		payments: relations.many.debtPayments(),
	},

	debtPayments: {
		household: relations.one.households({
			from: relations.debtPayments.householdId,
			to: relations.households.id,
		}),

		debt: relations.one.debts({
			from: relations.debtPayments.debtId,
			to: relations.debts.id,
		}),

		member: relations.one.householdMembers({
			from: relations.debtPayments.memberId,
			to: relations.householdMembers.id,
		}),
	},

	assets: {
		household: relations.one.households({
			from: relations.assets.householdId,
			to: relations.households.id,
		}),

		member: relations.one.householdMembers({
			from: relations.assets.memberId,
			to: relations.householdMembers.id,
		}),
	},

	calculations: {
		household: relations.one.households({
			from: relations.calculations.householdId,
			to: relations.households.id,
		}),

		member: relations.one.householdMembers({
			from: relations.calculations.memberId,
			to: relations.householdMembers.id,
		}),
	},
}));
