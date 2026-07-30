// src/shared/dates/tax-year.ts

export interface TaxYear {
	/**
	 * Calendar year in which the tax year begins.
	 *
	 * Example:
	 * 2026 represents the 2026–27 tax year.
	 */
	startYear: number;

	endYear: number;

	label: string;

	startDate: string;

	endDate: string;
}

const TAX_YEAR_START_MONTH_INDEX = 3;
const TAX_YEAR_START_DAY = 6;

function assertValidYear(year: number): void {
	if (!Number.isInteger(year) || year < 1900 || year > 9998) {
		throw new RangeError(
			"Tax year start year must be an integer between 1900 and 9998.",
		);
	}
}

/**
 * Parses a YYYY-MM-DD calendar date without allowing local timezone
 * conversion to move it into another date.
 */
export function parseCalendarDate(value: string): Date {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

	if (!match) {
		throw new RangeError(
			"Date must use the YYYY-MM-DD format.",
		);
	}

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);

	const date = new Date(Date.UTC(year, month - 1, day));

	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		throw new RangeError("Date is not a valid calendar date.");
	}

	return date;
}

export function formatCalendarDate(date: Date): string {
	if (Number.isNaN(date.getTime())) {
		throw new RangeError("Cannot format an invalid date.");
	}

	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

export function formatTaxYearLabel(startYear: number): string {
	assertValidYear(startYear);

	const endYear = startYear + 1;
	const shortEndYear = String(endYear).slice(-2);

	return `${startYear}-${shortEndYear}`;
}

export function createTaxYear(startYear: number): TaxYear {
	assertValidYear(startYear);

	const endYear = startYear + 1;

	return {
		startYear,
		endYear,
		label: formatTaxYearLabel(startYear),
		startDate: `${startYear}-04-06`,
		endDate: `${endYear}-04-05`,
	};
}

/**
 * Gets the UK tax year containing the supplied date.
 *
 * Dates from 1 January to 5 April belong to the tax year that began
 * in the previous calendar year.
 */
export function getTaxYearForDate(
	input: Date | string,
): TaxYear {
	const date =
		typeof input === "string"
			? parseCalendarDate(input)
			: new Date(input.getTime());

	if (Number.isNaN(date.getTime())) {
		throw new RangeError("Cannot determine tax year for an invalid date.");
	}

	const calendarYear = date.getUTCFullYear();
	const month = date.getUTCMonth();
	const day = date.getUTCDate();

	const isOnOrAfterTaxYearStart =
		month > TAX_YEAR_START_MONTH_INDEX ||
		(month === TAX_YEAR_START_MONTH_INDEX &&
			day >= TAX_YEAR_START_DAY);

	const startYear = isOnOrAfterTaxYearStart
		? calendarYear
		: calendarYear - 1;

	return createTaxYear(startYear);
}

export function getCurrentTaxYear(
	now: Date = new Date(),
): TaxYear {
	return getTaxYearForDate(now);
}

export function isDateInTaxYear(
	input: Date | string,
	taxYearStartYear: number,
): boolean {
	const taxYear = createTaxYear(taxYearStartYear);

	const date =
		typeof input === "string"
			? parseCalendarDate(input)
			: input;

	if (Number.isNaN(date.getTime())) {
		return false;
	}

	const start = parseCalendarDate(taxYear.startDate);
	const end = parseCalendarDate(taxYear.endDate);

	return date >= start && date <= end;
}

export function parseTaxYearLabel(label: string): TaxYear {
	const match = /^(\d{4})-(\d{2}|\d{4})$/.exec(
		label.trim(),
	);

	if (!match) {
		throw new RangeError(
			'Tax year must use the format "2026-27" or "2026-2027".',
		);
	}

	const startYear = Number(match[1]);
	const suppliedEndPart = match[2];

	const expectedEndYear = startYear + 1;

	const suppliedEndYear =
		suppliedEndPart.length === 2
			? Number(
					`${String(expectedEndYear).slice(0, 2)}${suppliedEndPart}`,
				)
			: Number(suppliedEndPart);

	if (suppliedEndYear !== expectedEndYear) {
		throw new RangeError(
			`The year after ${startYear} must be ${expectedEndYear}.`,
		);
	}

	return createTaxYear(startYear);
}

export function compareTaxYears(
	left: TaxYear,
	right: TaxYear,
): number {
	return left.startYear - right.startYear;
}