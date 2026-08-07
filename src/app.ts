import { auth } from "@/lib/auth";
import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import { sessionMiddleware } from "@/middleware/auth.middleware";
import {
	authenticationRateLimitMiddleware,
	generalRateLimitMiddleware,
} from "@/middleware/rate-limit.middleware";
import affordability from "@/modules/affordability/affordability.index";
import assets from "@/modules/assets/assets.index";
import calculations from "@/modules/calculations/calculations.index";
import calculators from "@/modules/calculators/calculators.index";
import debtPayments from "@/modules/debt-payments/debt-payments.index";
import debts from "@/modules/debts/debts.index";
import expenses from "@/modules/expenses/expenses.index";
import financialProfiles from "@/modules/financial-profiles/financial-profiles.index";
import financialRecords from "@/modules/financial-records/financial-records.index";
import health from "@/modules/health/health.index";
import households from "@/modules/households/households.index";
import incomeSources from "@/modules/income-sources/income-sources.index";
import members from "@/modules/members/members.index";

const app = createApp();

configureOpenAPI(app);

/**
 * Better Auth requests are usually unauthenticated, so rate-limit
 * these routes by client IP.
 */
app.use("/v1/auth/**", authenticationRateLimitMiddleware);

app.all("/v1/auth/**", (context) => auth.handler(context.req.raw));

/**
 * Resolve the authenticated session before applying the general API
 * limiter. Authenticated requests can then be limited by user ID.
 */
app.use("/v1/*", sessionMiddleware);
app.use("/v1/*", generalRateLimitMiddleware);

const routes = app
	.route("/health", health)
	.route("/v1/calculators", calculators)
	.route("/v1/households", households)
	.route("/v1/households/:householdId", financialProfiles)
	.route("/v1/households/:householdId", financialRecords)
	.route("/v1/households/:householdId/members", members)
	.route("/v1/households/:householdId/income-sources", incomeSources)
	.route("/v1/households/:householdId/expenses", expenses)
	.route("/v1/households/:householdId/debts", debts)
	.route("/v1/households/:householdId/debts", debtPayments)
	.route("/v1/households/:householdId/assets", assets)
	.route("/v1/households/:householdId/calculations", calculations)
	.route("/v1/households/:householdId/affordability", affordability);

export type AppType = typeof routes;

export default app;
