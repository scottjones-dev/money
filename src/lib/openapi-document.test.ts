import { describe, expect, it } from "vitest";
import app from "@/app";
import { auth } from "@/lib/auth";
import {
	buildMoneyOpenApiDocument,
	buildOpenApiDocument,
} from "@/lib/openapi-document";

const METHODS = ["get", "post", "put", "patch", "delete"] as const;

describe("OpenAPI document", () => {
	it("serves the same deterministic document used by the exporter", async () => {
		const [first, second, response] = await Promise.all([
			buildOpenApiDocument(app),
			buildOpenApiDocument(app),
			app.request("/doc"),
		]);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(first);
		expect(second).toEqual(first);
	});

	it("contains every Better Auth operation at its mounted path", async () => {
		const [document, authDocument] = await Promise.all([
			buildOpenApiDocument(app),
			auth.api.generateOpenAPISchema(),
		]);

		for (const [path, pathItem] of Object.entries(authDocument.paths)) {
			const mountedPath = `/v1/auth${path}`;
			expect(document.paths[mountedPath]).toBeDefined();
			for (const method of METHODS) {
				if (pathItem[method]) {
					expect(document.paths[mountedPath]?.[method]).toBeDefined();
				}
			}
		}
	});

	it("uses anonymous public routes and cookie security for protected routes", async () => {
		const document = await buildOpenApiDocument(app);
		expect(document.paths["/health"]?.get).toMatchObject({ security: [] });
		expect(document.paths["/v1/auth/sign-in/email"]?.post).toMatchObject({
			security: [],
		});
		expect(document.paths["/v1/auth/sign-out"]?.post).toMatchObject({
			security: [{ apiKeyCookie: [] }],
		});
		expect(document.paths["/v1/households"]?.get).toMatchObject({
			security: [{ apiKeyCookie: [] }],
		});
		expect(document.paths["/v1/calculators/income-tax"]?.post).toMatchObject({
			security: [],
		});
		expect(document.components?.securitySchemes).not.toHaveProperty(
			"bearerAuth",
		);
	});

	it("builds a money-only SDK contract without Better Auth operations", async () => {
		const document = await buildMoneyOpenApiDocument(app);
		expect(
			Object.keys(document.paths).some((path) => path.startsWith("/v1/auth/")),
		).toBe(false);
		expect(
			document.paths[
				"/v1/households/{householdId}/calculations/{calculator}/preview"
			]?.post,
		).toBeDefined();
		expect(document.paths["/v1/calculators/income-tax"]?.post).toMatchObject({
			security: [],
		});
	});

	it("retains generator-safe formats, nullability, decimals, pagination, and errors", async () => {
		const document = await buildOpenApiDocument(app);
		const schemas = document.components?.schemas as Record<
			string,
			Record<string, unknown>
		>;
		const properties = (name: string) =>
			(schemas[name]?.properties ?? {}) as Record<
				string,
				Record<string, unknown>
			>;

		expect(properties("Household").id).toMatchObject({
			type: "string",
			format: "uuid",
		});
		expect(properties("Expense").endDate).toMatchObject({
			type: ["string", "null"],
			format: "date",
		});
		expect(properties("Expense").createdAt?.format).toBe("date-time");
		expect(properties("CreateDebt").currentBalance).toMatchObject({
			type: "string",
			pattern: expect.any(String),
		});
		expect(properties("PaginationMeta").page).toMatchObject({
			type: "integer",
			minimum: 1,
		});
		expect(schemas.ErrorCode?.enum).toContain("HOUSEHOLD_NOT_FOUND");
	});
});
