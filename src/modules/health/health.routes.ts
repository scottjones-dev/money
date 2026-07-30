// src/modules/health/health.routes.ts
import { createRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";

import { healthResponseSchema } from "./health.schemas";

export const healthRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["Health"],
	summary: "Check API health",
	description: "Checks the API process and PostgreSQL database connection.",
	responses: {
		200: jsonContent(
			healthResponseSchema,
			"The service and its dependencies are healthy",
		),
		503: jsonContent(
			healthResponseSchema,
			"One or more dependencies are unavailable",
		),
	},
});
