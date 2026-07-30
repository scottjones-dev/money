// src/shared/dates/assessment-period.ts
import { formatCalendarDate, parseCalendarDate } from "./tax-year";

export interface AssessmentPeriod {
	startDate: string;
	endDate: string;

	/**
	 * The payment date is normally seven calendar days after the end
	 * of the assessment period.
	 */
	expectedPaymentDate: string;

	startDay: number;

	/**
	 * Zero-based position relative to the first assessment period.
	 */
	index: number;
}

export interface AssessmentPeriodRange {
	firstPeriodStartDate: string;
	startDay: number;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function assertValidAssessmentPeriodDay(day: number): void {
	if (!Number.isInteger(day) || day < 1 || day > 31) {
		throw new RangeError(
			"Assessment-period start day must be an integer from 1 to 31.",
		);
	}
}

function assertValidPeriodIndex(index: number): void {
	if (!Number.isInteger(index)) {
		throw new RangeError("Assessment-period index must be an integer.");
	}
}

function daysInUtcMonth(year: number, monthIndex: number): number {
	return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Creates a date for the requested calendar day, clamping it to the
 * final available day of the month.
 *
 * Examples:
 * day 31 in February becomes 28 or 29.
 * day 31 in April becomes 30.
 */
function createClampedUtcDate(
	year: number,
	monthIndex: number,
	day: number,
): Date {
	assertValidAssessmentPeriodDay(day);

	const normalised = new Date(Date.UTC(year, monthIndex, 1));

	const normalisedYear = normalised.getUTCFullYear();
	const normalisedMonth = normalised.getUTCMonth();

	const finalDay = daysInUtcMonth(normalisedYear, normalisedMonth);

	return new Date(
		Date.UTC(normalisedYear, normalisedMonth, Math.min(day, finalDay)),
	);
}

function addUtcDays(date: Date, days: number): Date {
	return new Date(
		Date.UTC(
			date.getUTCFullYear(),
			date.getUTCMonth(),
			date.getUTCDate() + days,
		),
	);
}

function addUtcMonthsAnchored(
	date: Date,
	months: number,
	anchorDay: number,
): Date {
	return createClampedUtcDate(
		date.getUTCFullYear(),
		date.getUTCMonth() + months,
		anchorDay,
	);
}

function compareCalendarDates(left: Date, right: Date): number {
	return left.getTime() - right.getTime();
}

export function createAssessmentPeriod(input: {
	firstPeriodStartDate: string;
	index: number;
}): AssessmentPeriod {
	assertValidPeriodIndex(input.index);

	const firstStart = parseCalendarDate(input.firstPeriodStartDate);

	const startDay = firstStart.getUTCDate();

	const start = addUtcMonthsAnchored(firstStart, input.index, startDay);

	const nextStart = addUtcMonthsAnchored(firstStart, input.index + 1, startDay);

	const end = addUtcDays(nextStart, -1);
	const expectedPaymentDate = addUtcDays(end, 7);

	return {
		startDate: formatCalendarDate(start),
		endDate: formatCalendarDate(end),
		expectedPaymentDate: formatCalendarDate(expectedPaymentDate),
		startDay,
		index: input.index,
	};
}

/**
 * Returns the assessment period containing the supplied calendar date.
 */
export function getAssessmentPeriodForDate(input: {
	firstPeriodStartDate: string;
	date: string;
}): AssessmentPeriod {
	const firstStart = parseCalendarDate(input.firstPeriodStartDate);
	const target = parseCalendarDate(input.date);

	if (target < firstStart) {
		throw new RangeError(
			"The requested date is before the first assessment period.",
		);
	}

	const estimatedIndex =
		(target.getUTCFullYear() - firstStart.getUTCFullYear()) * 12 +
		target.getUTCMonth() -
		firstStart.getUTCMonth();

	let index = Math.max(0, estimatedIndex);
	let period = createAssessmentPeriod({
		firstPeriodStartDate: input.firstPeriodStartDate,
		index,
	});

	while (target < parseCalendarDate(period.startDate)) {
		index -= 1;

		period = createAssessmentPeriod({
			firstPeriodStartDate: input.firstPeriodStartDate,
			index,
		});
	}

	while (target > parseCalendarDate(period.endDate)) {
		index += 1;

		period = createAssessmentPeriod({
			firstPeriodStartDate: input.firstPeriodStartDate,
			index,
		});
	}

	return period;
}

export function getNextAssessmentPeriod(
	period: AssessmentPeriod,
	firstPeriodStartDate: string,
): AssessmentPeriod {
	return createAssessmentPeriod({
		firstPeriodStartDate,
		index: period.index + 1,
	});
}

export function getPreviousAssessmentPeriod(
	period: AssessmentPeriod,
	firstPeriodStartDate: string,
): AssessmentPeriod {
	if (period.index <= 0) {
		throw new RangeError("The first assessment period has no previous period.");
	}

	return createAssessmentPeriod({
		firstPeriodStartDate,
		index: period.index - 1,
	});
}

export function isDateInAssessmentPeriod(
	date: string,
	period: AssessmentPeriod,
): boolean {
	const target = parseCalendarDate(date);
	const start = parseCalendarDate(period.startDate);
	const end = parseCalendarDate(period.endDate);

	return (
		compareCalendarDates(target, start) >= 0 &&
		compareCalendarDates(target, end) <= 0
	);
}

export function getAssessmentPeriodLengthInDays(
	period: AssessmentPeriod,
): number {
	const start = parseCalendarDate(period.startDate);
	const end = parseCalendarDate(period.endDate);

	return (
		Math.floor((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY) + 1
	);
}

export function listAssessmentPeriods(input: {
	firstPeriodStartDate: string;
	fromIndex?: number;
	count: number;
}): AssessmentPeriod[] {
	const fromIndex = input.fromIndex ?? 0;

	assertValidPeriodIndex(fromIndex);

	if (!Number.isInteger(input.count) || input.count < 0) {
		throw new RangeError(
			"Assessment-period count must be a non-negative integer.",
		);
	}

	return Array.from({ length: input.count }, (_, offset) =>
		createAssessmentPeriod({
			firstPeriodStartDate: input.firstPeriodStartDate,
			index: fromIndex + offset,
		}),
	);
}
