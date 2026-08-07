import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { benefitSchemeKeys } from "../src/rules/benefits";

const HTTP_METHODS = new Set([
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"options",
	"head",
]);

type JsonObject = Record<string, unknown>;

const contractPath = process.argv[2] ?? "openapi/openapi.json";
const document = JSON.parse(
	await readFile(resolve(process.cwd(), contractPath), "utf8"),
) as JsonObject;
const failures: string[] = [];
const operationIds = new Map<string, string>();

function object(value: unknown): JsonObject | undefined {
	return value && typeof value === "object" && !Array.isArray(value)
		? (value as JsonObject)
		: undefined;
}

function resolveReference(reference: string): unknown {
	if (!reference.startsWith("#/")) return undefined;
	return reference
		.slice(2)
		.split("/")
		.map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
		.reduce<unknown>((current, part) => object(current)?.[part], document);
}

function checkReferences(value: unknown, location = "#"): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			checkReferences(item, `${location}/${index}`);
		});
		return;
	}
	const current = object(value);
	if (!current) return;
	for (const [key, child] of Object.entries(current)) {
		if (key === "$ref" && typeof child === "string") {
			if (resolveReference(child) === undefined) {
				failures.push(`${location}: unresolved reference ${child}`);
			}
		} else {
			checkReferences(child, `${location}/${key}`);
		}
	}
}

const paths = object(document.paths) ?? {};
let businessOperationCount = 0;

for (const [path, rawPathItem] of Object.entries(paths)) {
	if (path.includes(":")) failures.push(`${path}: colon-style path parameter`);
	const pathItem = object(rawPathItem) ?? {};
	for (const [method, rawOperation] of Object.entries(pathItem)) {
		if (!HTTP_METHODS.has(method)) continue;
		const operation = object(rawOperation) ?? {};
		const location = `${method.toUpperCase()} ${path}`;
		if (!path.startsWith("/v1/auth")) businessOperationCount += 1;

		const operationId = operation.operationId;
		if (typeof operationId !== "string" || operationId.length === 0) {
			failures.push(`${location}: missing operationId`);
		} else if (operationIds.has(operationId)) {
			failures.push(
				`${location}: duplicate operationId ${operationId} (also ${operationIds.get(operationId)})`,
			);
		} else {
			operationIds.set(operationId, location);
		}

		for (const field of ["summary", "description"] as const) {
			if (
				typeof operation[field] !== "string" ||
				operation[field].length === 0
			) {
				failures.push(`${location}: missing ${field}`);
			}
		}
		if (!Array.isArray(operation.tags) || operation.tags.length === 0) {
			failures.push(`${location}: missing tags`);
		}
		if (!Array.isArray(operation.security)) {
			failures.push(`${location}: missing explicit security`);
		}

		const declaredPathParameters = new Set<string>();
		const parameters = Array.isArray(operation.parameters)
			? operation.parameters
			: [];
		for (const rawParameter of parameters) {
			const parameter = object(rawParameter);
			if (!parameter) continue;
			if (typeof parameter.description !== "string") {
				failures.push(
					`${location}: parameter ${String(parameter.name)} lacks a description`,
				);
			}
			if (parameter.in === "path" && typeof parameter.name === "string") {
				declaredPathParameters.add(parameter.name);
				if (parameter.required !== true) {
					failures.push(
						`${location}: path parameter ${parameter.name} is not required`,
					);
				}
			}
		}
		const pathParameters = new Set(
			[...path.matchAll(/\{([^}]+)\}/g)].map((match) => match[1] ?? ""),
		);
		for (const name of new Set([
			...pathParameters,
			...declaredPathParameters,
		])) {
			if (!pathParameters.has(name) || !declaredPathParameters.has(name)) {
				failures.push(`${location}: unmatched path parameter ${name}`);
			}
		}

		const requestBody = object(operation.requestBody);
		if (requestBody && typeof requestBody.description !== "string") {
			failures.push(`${location}: request body lacks a description`);
		}
		const responses = object(operation.responses) ?? {};
		if (!Object.keys(responses).some((status) => /^2\d\d$/.test(status))) {
			failures.push(`${location}: missing success response`);
		}
		for (const [status, rawResponse] of Object.entries(responses)) {
			const response = object(rawResponse) ?? {};
			if (
				typeof response.$ref !== "string" &&
				typeof response.description !== "string"
			) {
				failures.push(`${location}: response ${status} lacks a description`);
			}
		}

		if (!path.startsWith("/v1/auth") && path !== "/health") {
			for (const status of path.startsWith("/v1/calculators/")
				? ["429", "500"]
				: ["401", "429", "500"]) {
				if (!(status in responses)) {
					failures.push(`${location}: missing middleware response ${status}`);
				}
			}
			for (const [status, rawResponse] of Object.entries(responses)) {
				if (!/^2\d\d$/.test(status) || status === "204") continue;
				const response = object(rawResponse);
				const schema = object(
					object(object(response?.content)?.["application/json"])?.schema,
				);
				if (typeof schema?.$ref !== "string") {
					failures.push(
						`${location}: success ${status} must use a named response model`,
					);
				}
			}
		}
	}
}

if (businessOperationCount < 25)
	failures.push(
		`expected at least 25 business operations, found ${businessOperationCount}`,
	);

const schemes = object(object(document.components)?.securitySchemes) ?? {};
if (!("apiKeyCookie" in schemes))
	failures.push("missing apiKeyCookie security scheme");
if ("bearerAuth" in schemes) failures.push("bearerAuth must not be present");

for (const path of contractPath.includes("money.openapi")
	? []
	: [
			"/v1/auth/sign-up/email",
			"/v1/auth/sign-in/email",
			"/v1/auth/sign-out",
			"/v1/auth/get-session",
			"/v1/auth/request-password-reset",
			"/v1/auth/organization/create",
		]) {
	if (!(path in paths))
		failures.push(`missing required authentication path ${path}`);
}

for (const path of [
	"/v1/calculators/income-tax",
	"/v1/calculators/national-insurance",
	"/v1/calculators/student-loan",
	"/v1/households/{householdId}/assets",
	"/v1/households/{householdId}/debts/{debtId}/payments",
	"/v1/households/{householdId}/calculations/{calculator}/preview",
	"/v1/households/{householdId}/budgets",
	"/v1/households/{householdId}/repayment-plans",
	"/v1/households/{householdId}/assessments",
])
	if (!(path in paths)) failures.push(`missing required money path ${path}`);

checkReferences(document);

const schemas = object(object(document.components)?.schemas) ?? {};
const benefitSchemeSchema = object(schemas.BenefitSchemeKey);
const documentedBenefitSchemes = new Set(
	Array.isArray(benefitSchemeSchema?.enum)
		? (benefitSchemeSchema.enum as unknown[]).filter(
				(value): value is string => typeof value === "string",
			)
		: [],
);
for (const scheme of benefitSchemeKeys)
	if (!documentedBenefitSchemes.has(scheme))
		failures.push(`BenefitSchemeKey is missing ${scheme}`);
if (documentedBenefitSchemes.size !== benefitSchemeKeys.length)
	failures.push(
		`BenefitSchemeKey contains ${documentedBenefitSchemes.size} values; expected ${benefitSchemeKeys.length}`,
	);
function checkSchemaDocumentation(value: unknown, location: string): void {
	if (Array.isArray(value)) {
		value.forEach((item, index) => {
			checkSchemaDocumentation(item, `${location}/${index}`);
		});
		return;
	}
	const schema = object(value);
	if (!schema) return;
	const properties = object(schema.properties);
	if (properties) {
		for (const [name, rawProperty] of Object.entries(properties)) {
			const property = object(rawProperty);
			if (!property) continue;
			if (typeof property.description !== "string") {
				failures.push(`${location}/${name}: missing field description`);
			}
			const propertyTypes = Array.isArray(property.type)
				? property.type
				: [property.type];
			const isScalar = propertyTypes.some((type) =>
				["string", "number", "integer", "boolean"].includes(String(type)),
			);
			if (isScalar && !("example" in property)) {
				failures.push(`${location}/${name}: missing field example`);
			}
			if (
				/(?:amount|balance|payment|income|expenses|costs|buffer|commitment)$/i.test(
					name,
				) &&
				propertyTypes.includes("string") &&
				typeof property.pattern !== "string"
			) {
				failures.push(`${location}/${name}: decimal string lacks a pattern`);
			}
		}
	}
	for (const [name, child] of Object.entries(schema)) {
		if (name !== "properties") {
			checkSchemaDocumentation(child, `${location}/${name}`);
		}
	}
}
checkSchemaDocumentation(schemas, "#/components/schemas");

if (failures.length > 0) {
	console.error(`OpenAPI contract check failed:\n- ${failures.join("\n- ")}`);
	process.exitCode = 1;
} else {
	console.log(
		`OpenAPI contract check passed (${businessOperationCount} business operations, ${operationIds.size - businessOperationCount} authentication operations).`,
	);
}
