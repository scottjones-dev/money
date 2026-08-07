import { createRouter } from "@/lib/create-app";
import {
	incomeTaxHandler,
	nationalInsuranceHandler,
	pensionReliefHandler,
	studentLoanHandler,
	takeHomeHandler,
} from "./calculators.handlers";
import {
	incomeTaxRoute,
	nationalInsuranceRoute,
	pensionReliefRoute,
	studentLoanRoute,
	takeHomeRoute,
} from "./calculators.routes";

const router = createRouter();
router.openapi(incomeTaxRoute, incomeTaxHandler);
router.openapi(nationalInsuranceRoute, nationalInsuranceHandler);
router.openapi(studentLoanRoute, studentLoanHandler);
router.openapi(pensionReliefRoute, pensionReliefHandler);
router.openapi(takeHomeRoute, takeHomeHandler);
export default router;
