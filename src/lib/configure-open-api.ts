// src/lib/configure-open-api.ts
import { Scalar } from "@scalar/hono-api-reference";

import { API_DESCRIPTION, API_NAME, API_VERSION } from "@/lib/constants";
import type { AppOpenAPI } from "@/types/app";

export default function configureOpenAPI(app: AppOpenAPI): void {
	app.doc("/doc", {
		openapi: "3.1.0",
		info: {
			version: API_VERSION,
			title: API_NAME,
			description: API_DESCRIPTION,
		},
		tags: [
			{
				name: "Health",
				description: "Application and dependency health checks",
			},
			{
				name: "Authentication",
				description: "User authentication and session management",
			},
			{
				name: "Households",
				description: "Household financial profiles",
			},
			{
				name: "Calculations",
				description: "UK financial calculations",
			},
		],
	});

	app.get(
		"/reference",
		Scalar({
			theme: "saturn",
			layout: "modern",
			defaultHttpClient: {
				targetKey: "js",
				clientKey: "fetch",
			},
			spec: {
				url: "/doc",
			},
		}),
	);
}
