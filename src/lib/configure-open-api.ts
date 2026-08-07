// src/lib/configure-open-api.ts
import { Scalar } from "@scalar/hono-api-reference";
import {
	buildMoneyOpenApiDocument,
	buildOpenApiDocument,
} from "@/lib/openapi-document";
import type { AppOpenAPI } from "@/types/app";

export default function configureOpenAPI(app: AppOpenAPI): void {
	app.get("/doc", async (context) =>
		context.json(await buildOpenApiDocument(app)),
	);

	app.get("/doc/money", async (context) =>
		context.json(await buildMoneyOpenApiDocument(app)),
	);

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
