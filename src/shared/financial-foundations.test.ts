import { describe, expect, it } from "vitest";

import { getIncomeTaxRules, getNationalInsuranceRules } from "@/rules/registry";
import { createAssessmentPeriod } from "@/shared/dates/assessment-period";
import { getTaxYearForDate, parseTaxYearLabel } from "@/shared/dates/tax-year";
import {
	normaliseDecimalToMonthly,
	normaliseDecimalToYearly,
} from "@/shared/frequency/normalise-frequency";

describe("financial foundations", () => {
	it("normalises recurring frequencies without early rounding", () => {
		expect(normaliseDecimalToYearly("100", "weekly").toString()).toBe("5200");
		expect(normaliseDecimalToMonthly("100", "four_weekly").toString()).toBe(
			"108.33333333333333333",
		);
	});

	it("handles UK tax-year boundaries", () => {
		expect(getTaxYearForDate("2026-04-05").label).toBe("2025-26");
		expect(getTaxYearForDate("2026-04-06").label).toBe("2026-27");
		expect(parseTaxYearLabel("2026-2027").startYear).toBe(2026);
	});

	it("clamps assessment periods to shorter months", () => {
		expect(
			createAssessmentPeriod({
				firstPeriodStartDate: "2026-01-31",
				index: 1,
			}),
		).toMatchObject({
			startDate: "2026-02-28",
			endDate: "2026-03-30",
		});
	});

	it("resolves registered tax and National Insurance rules", () => {
		expect(
			getIncomeTaxRules({ taxYear: "2026-27", jurisdiction: "scotland" })
				.taxYear,
		).toBe("2026-27");
		expect(getNationalInsuranceRules("2025-26").taxYear).toBe("2025-26");
	});
});
