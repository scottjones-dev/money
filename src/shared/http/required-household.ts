import { AppError } from "@/shared/errors/app-error";
import { ERROR_CODES } from "@/shared/errors/error-codes";
import type { HouseholdContext } from "@/types/app";

export function getRequiredHousehold(
	household: HouseholdContext | null,
): HouseholdContext {
	if (!household) {
		throw new AppError({
			code: ERROR_CODES.HOUSEHOLD_NOT_FOUND,
			message: "The household could not be found.",
			statusCode: 404,
		});
	}

	return household;
}
