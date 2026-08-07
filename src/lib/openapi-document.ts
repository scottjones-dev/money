import { env } from "@/env";
import { auth } from "@/lib/auth";
import {
	API_DESCRIPTION,
	API_NAME,
	API_VERSION,
	LOCAL_BASE_URL,
} from "@/lib/constants";
import type { AppOpenAPI } from "@/types/app";

const HTTP_METHODS = [
	"get",
	"post",
	"put",
	"patch",
	"delete",
	"options",
	"head",
] as const;

const PUBLIC_AUTH_PATHS = new Set([
	"/callback/{id}",
	"/delete-user/callback",
	"/error",
	"/get-session",
	"/ok",
	"/request-password-reset",
	"/reset-password",
	"/reset-password/{token}",
	"/send-verification-email",
	"/sign-in/email",
	"/sign-in/social",
	"/sign-up/email",
	"/verify-email",
]);

const TAGS = [
	{
		name: "Authentication",
		description: "Cookie-based user authentication and session management.",
	},
	{
		name: "Organizations",
		description: "Better Auth organization and membership management.",
	},
	{ name: "Health", description: "Application and dependency health checks." },
	{ name: "Households", description: "Household financial profiles." },
	{
		name: "Household Members",
		description: "People included in household finances.",
	},
	{ name: "Income Sources", description: "Household income records." },
	{ name: "Expenses", description: "Household expenditure records." },
	{ name: "Debts", description: "Household debt records." },
	{
		name: "Debt Payments",
		description: "Auditable payments recorded against household debts.",
	},
	{ name: "Assets", description: "Household asset values and ownership." },
	{
		name: "Employment and Payroll",
		description: "Employment facts and take-home pay estimates.",
	},
	{
		name: "Pensions",
		description: "Pension pots, contributions, relief, and projections.",
	},
	{
		name: "Household Facts",
		description: "Encrypted reusable facts for entitlement calculations.",
	},
	{
		name: "Tax Calculators",
		description:
			"Anonymous UK tax, National Insurance, and student-loan estimates.",
	},
	{
		name: "Calculations",
		description: "Versioned household calculation previews and commits.",
	},
	{ name: "Budgeting", description: "Versioned recurring household budgets." },
	{ name: "Repayment Plans", description: "Stored debt repayment scenarios." },
	{
		name: "Assessments",
		description: "Explainable household financial-health reports.",
	},
	{
		name: "Affordability",
		description: "Household affordability calculations.",
	},
];

type JsonObject = Record<string, unknown>;
type Operation = JsonObject & {
	operationId?: string;
	summary?: string;
	description?: string;
	tags?: string[];
	security?: JsonObject[];
	parameters?: JsonObject[];
	responses?: Record<string, unknown>;
	requestBody?: JsonObject;
};

interface OpenApiDocument extends JsonObject {
	openapi: string;
	paths: Record<string, Record<string, unknown>>;
	components?: {
		schemas?: Record<string, unknown>;
		securitySchemes?: Record<string, unknown>;
		responses?: Record<string, unknown>;
		[key: string]: unknown;
	};
	tags?: Array<{ name: string; description?: string }>;
}

const errorResponse = (description: string): JsonObject => ({
	description,
	content: {
		"application/json": {
			schema: { $ref: "#/components/schemas/ErrorResponse" },
		},
	},
});

const authErrorResponse = (description: string): JsonObject => ({
	description,
	content: {
		"application/json": {
			schema: { $ref: "#/components/schemas/BetterAuthErrorResponse" },
		},
	},
});

const SHARED_RESPONSES: Record<string, JsonObject> = {
	BadRequest: errorResponse("The request is malformed or invalid."),
	Unauthorized: errorResponse("A valid cookie session is required."),
	Forbidden: errorResponse("The session lacks permission for this operation."),
	NotFound: errorResponse("The requested resource was not found."),
	Conflict: errorResponse(
		"The request conflicts with the current resource state.",
	),
	ValidationFailed: errorResponse("Request validation failed."),
	RateLimited: errorResponse("The request rate limit was exceeded."),
	InternalServerError: errorResponse("An unexpected server error occurred."),
	ServiceUnavailable: errorResponse("A required service is unavailable."),
	AuthBadRequest: authErrorResponse("Better Auth rejected the request."),
	AuthUnauthorized: authErrorResponse(
		"Better Auth could not authenticate the request.",
	),
	AuthForbidden: authErrorResponse("Better Auth denied the operation."),
	AuthNotFound: authErrorResponse(
		"The requested Better Auth resource was not found.",
	),
	AuthConflict: authErrorResponse(
		"The Better Auth request conflicts with current state.",
	),
	AuthValidationFailed: authErrorResponse(
		"Better Auth request validation failed.",
	),
};

const ERROR_RESPONSE_BY_STATUS: Record<string, string> = {
	"400": "BadRequest",
	"401": "Unauthorized",
	"403": "Forbidden",
	"404": "NotFound",
	"409": "Conflict",
	"422": "ValidationFailed",
	"429": "RateLimited",
	"500": "InternalServerError",
	"503": "ServiceUnavailable",
};

const TAG_ALIASES: Record<string, string> = {
	"Household members": "Household Members",
	"Income sources": "Income Sources",
};

const PROPERTY_DESCRIPTIONS: Record<string, string> = {
	id: "The unique identifier for this resource.",
	householdId: "The UUID of the household that owns this resource.",
	organizationId: "The Better Auth organization identifier for the household.",
	memberId:
		"The UUID of the associated household member, or null when household-wide.",
	authUserId: "The Better Auth user identifier linked to this member, or null.",
	createdAt: "The date and time the resource was created.",
	updatedAt: "The date and time the resource was last updated.",
	calculatedAt: "The date and time the affordability result was calculated.",
	startDate: "The calendar date on which the record starts, or null.",
	endDate: "The calendar date on which the record ends, or null.",
	dateOfBirth: "The member's date of birth, or null.",
	expectedEndDate:
		"The expected calendar date on which the debt ends, or null.",
	settledAt: "The date and time the debt was settled, or null.",
	name: "The human-readable name.",
	description: "A human-readable description.",
	status: "The current status.",
	type: "The resource classification.",
	data: "The resources returned for this page.",
	pagination: "Metadata describing the current result page.",
	page: "The one-based page number.",
	pageSize: "The maximum number of resources returned per page.",
	totalItems: "The total number of matching resources.",
	totalPages: "The total number of result pages.",
	hasPreviousPage: "Whether a previous result page exists.",
	hasNextPage: "Whether another result page exists.",
	requestId: "The request identifier used for tracing and support.",
	code: "A stable machine-readable error code.",
	message: "A human-readable explanation.",
	details: "Optional field-level error details.",
	error: "The structured API error.",
	success: "Whether the operation completed successfully.",
	deletedId: "The UUID of the deleted resource.",
	deletedMemberId: "The UUID of the deleted household member.",
	currency: "The ISO 4217 currency code; currently GBP.",
	country: "The ISO 3166-1 alpha-2 country code; currently GB.",
	postcodeArea: "The UK outward postcode area or district, or null.",
	amount:
		"A decimal monetary amount encoded as a string to preserve precision.",
	grossAmount: "The gross decimal monetary amount encoded as a string.",
	currentBalance: "The current decimal balance encoded as a string.",
	originalBalance: "The original decimal balance encoded as a string, or null.",
	creditLimit: "The decimal credit limit encoded as a string, or null.",
	minimumPayment: "The minimum decimal payment encoded as a string.",
	plannedPayment: "The planned decimal payment encoded as a string, or null.",
	proposedMonthlyCommitment:
		"The proposed monthly decimal commitment encoded as a string.",
	requiredMonthlyBuffer:
		"The required monthly decimal buffer encoded as a string.",
	annualInterestRate:
		"The annual percentage interest rate encoded as a decimal string.",
	normalised: "Equivalent weekly, monthly, and yearly decimal amounts.",
	normalisedPayment:
		"Equivalent weekly, monthly, and yearly decimal payment amounts.",
	weekly: "The weekly decimal amount encoded as a string.",
	monthly: "The monthly decimal amount encoded as a string.",
	yearly: "The yearly decimal amount encoded as a string.",
};

const MONEY_PROPERTIES = new Set([
	"amount",
	"grossAmount",
	"currentBalance",
	"originalBalance",
	"creditLimit",
	"minimumPayment",
	"plannedPayment",
	"weekly",
	"monthly",
	"yearly",
	"netMonthlyIncome",
	"benefitIncome",
	"otherIncome",
	"totalMonthlyIncome",
	"essentialExpenses",
	"importantExpenses",
	"discretionaryExpenses",
	"debtPayments",
	"housingCosts",
	"totalMonthlyExpenses",
	"currentDisposableIncome",
	"projectedDisposableIncome",
	"requiredMonthlyBuffer",
	"availableAfterBuffer",
	"proposedMonthlyCommitment",
]);

const DATE_PROPERTIES = new Set([
	"startDate",
	"endDate",
	"dateOfBirth",
	"expectedEndDate",
]);

function schemaType(schema: JsonObject): string | undefined {
	if (typeof schema.type === "string") return schema.type;
	if (Array.isArray(schema.type)) {
		return schema.type.find((type) => type !== "null");
	}
	return undefined;
}

function exampleForProperty(name: string, schema: JsonObject): unknown {
	if (
		["string", "number", "integer", "boolean"].includes(typeof schema.default)
	)
		return schema.default;
	if (Array.isArray(schema.enum) && schema.enum.length > 0)
		return schema.enum[0];
	if (schema.format === "date-time") return "2026-07-30T18:00:00.000Z";
	if (schema.format === "date") return "2026-07-30";
	if (MONEY_PROPERTIES.has(name)) return "100.00";
	if (name.endsWith("Percentage") || name === "annualInterestRate")
		return "25.00";
	if (["annualGrowthRate", "annualChargeRate", "withdrawalRate"].includes(name))
		return "5.0000";
	if (name === "period" || name === "month") return "2026-07";
	if (name === "postcodeArea") return "SP4";
	if (name === "niCategory") return "A";
	if (DATE_PROPERTIES.has(name)) return "2026-07-30";
	if (name.endsWith("At")) return "2026-07-30T18:00:00.000Z";
	if (schema.format === "uuid") return "074f1038-70b1-467e-b5c6-72d14c8fa659";
	if (schema.format === "email") return "alex@example.com";
	if (schemaType(schema) === "boolean") return true;
	if (schemaType(schema) === "integer" || schemaType(schema) === "number")
		return typeof schema.minimum === "number" ? Math.max(1, schema.minimum) : 1;
	if (schemaType(schema) === "string") {
		const example = `${humanize(name)} example`;
		return typeof schema.maxLength === "number"
			? example.slice(0, schema.maxLength)
			: example;
	}
	return undefined;
}

function humanize(value: string): string {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replaceAll("_", " ")
		.toLowerCase();
}

function documentSchemaProperties(value: unknown): void {
	if (Array.isArray(value)) {
		value.forEach(documentSchemaProperties);
		return;
	}
	if (!value || typeof value !== "object") return;
	const object = value as JsonObject;
	if (object.properties && typeof object.properties === "object") {
		for (const [name, property] of Object.entries(object.properties)) {
			if (property && typeof property === "object") {
				const propertyObject = property as JsonObject;
				propertyObject.description ??=
					PROPERTY_DESCRIPTIONS[name] ?? `The ${humanize(name)} value.`;
				if (MONEY_PROPERTIES.has(name)) {
					propertyObject.pattern ??= "^-?\\d{1,12}(?:\\.\\d{1,2})?$";
				}
				if (name.endsWith("Percentage") || name === "annualInterestRate") {
					propertyObject.pattern ??= "^\\d{1,3}(?:\\.\\d{1,2})?$";
				}
				if (DATE_PROPERTIES.has(name)) propertyObject.format ??= "date";
				if (name.endsWith("At")) propertyObject.format ??= "date-time";
				propertyObject.example ??= exampleForProperty(name, propertyObject);
			}
		}
	}
	Object.values(object).forEach(documentSchemaProperties);
}

function convertNullableSchemas(value: unknown): void {
	if (Array.isArray(value)) {
		value.forEach(convertNullableSchemas);
		return;
	}
	if (!value || typeof value !== "object") return;
	const object = value as JsonObject;
	if (object.nullable === true) {
		delete object.nullable;
		if (typeof object.type === "string") {
			object.type = [object.type, "null"];
		} else if (Array.isArray(object.type) && !object.type.includes("null")) {
			object.type.push("null");
		} else if (typeof object.$ref === "string") {
			const reference = object.$ref;
			delete object.$ref;
			object.anyOf = [{ $ref: reference }, { type: "null" }];
		}
	}
	Object.values(object).forEach(convertNullableSchemas);
}

function referencedSchemaNames(value: unknown, names: Set<string>): void {
	if (Array.isArray(value)) {
		value.forEach((item) => {
			referencedSchemaNames(item, names);
		});
		return;
	}
	if (!value || typeof value !== "object") return;
	for (const [key, child] of Object.entries(value)) {
		if (
			key === "$ref" &&
			typeof child === "string" &&
			child.startsWith("#/components/schemas/")
		) {
			names.add(child.slice("#/components/schemas/".length));
		} else {
			referencedSchemaNames(child, names);
		}
	}
}

function removeUnusedSchemas(document: OpenApiDocument): void {
	const schemas = document.components?.schemas;
	if (!schemas) return;
	const roots = new Set<string>();
	referencedSchemaNames(
		{ paths: document.paths, responses: document.components?.responses },
		roots,
	);
	const retained = new Set(roots);
	const queue = [...roots];
	while (queue.length > 0) {
		const name = queue.shift();
		if (!name) continue;
		const dependencies = new Set<string>();
		referencedSchemaNames(schemas[name], dependencies);
		for (const dependency of dependencies) {
			if (!retained.has(dependency)) {
				retained.add(dependency);
				queue.push(dependency);
			}
		}
	}
	for (const name of Object.keys(schemas)) {
		if (!retained.has(name)) delete schemas[name];
	}
}

function removeUnusedResponses(document: OpenApiDocument): void {
	const responses = document.components?.responses;
	if (!responses) return;
	const used = new Set<string>();
	function collect(value: unknown): void {
		if (Array.isArray(value)) {
			value.forEach(collect);
			return;
		}
		if (!value || typeof value !== "object") return;
		for (const [key, child] of Object.entries(value)) {
			if (
				key === "$ref" &&
				typeof child === "string" &&
				child.startsWith("#/components/responses/")
			) {
				used.add(child.slice("#/components/responses/".length));
			} else {
				collect(child);
			}
		}
	}
	collect(document.paths);
	for (const name of Object.keys(responses)) {
		if (!used.has(name)) delete responses[name];
	}
}

function operationEntries(document: OpenApiDocument) {
	return Object.entries(document.paths).flatMap(([path, pathItem]) =>
		HTTP_METHODS.flatMap((method) => {
			const operation = pathItem[method];
			return operation && typeof operation === "object"
				? [{ path, method, operation: operation as Operation }]
				: [];
		}),
	);
}

function capitalize(value: string): string {
	return value.length === 0
		? value
		: `${value[0]?.toUpperCase()}${value.slice(1)}`;
}

function generatedOperationId(method: string, path: string): string {
	const words = path
		.replace(/[{}]/g, "")
		.split(/[\W_]+/)
		.filter(Boolean)
		.map(capitalize)
		.join("");
	return `${method}${words}`;
}

function rewriteRefs(
	value: unknown,
	schemaNames: Map<string, string>,
): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => rewriteRefs(item, schemaNames));
	}
	if (!value || typeof value !== "object") return value;

	const result: JsonObject = {};
	for (const [key, child] of Object.entries(value)) {
		if (key === "$ref" && typeof child === "string") {
			const prefix = "#/components/schemas/";
			const original = child.startsWith(prefix)
				? child.slice(prefix.length)
				: "";
			result[key] =
				original && schemaNames.has(original)
					? `${prefix}${schemaNames.get(original)}`
					: child;
		} else {
			result[key] = rewriteRefs(child, schemaNames);
		}
	}
	return result;
}

function normalizeBusinessDocument(document: OpenApiDocument): void {
	document.tags = TAGS;
	document.components ??= {};
	document.components.securitySchemes = {
		apiKeyCookie: {
			type: "apiKey",
			in: "cookie",
			name: "better-auth.session_token",
			description:
				"Better Auth session cookie. Browser clients must use credentials: 'include'; Node clients must persist and resend Set-Cookie values.",
		},
	};
	document.components.responses = SHARED_RESPONSES;
	document.components.schemas ??= {};
	document.components.schemas.AuthSuccessResponse = {
		type: "object",
		description:
			"A successful Better Auth response whose fields depend on the selected authentication plugin operation.",
		additionalProperties: true,
	};
	document.components.schemas.BetterAuthErrorResponse = {
		type: "object",
		description: "The error envelope returned directly by Better Auth.",
		properties: {
			code: {
				type: "string",
				description: "A Better Auth error code, when supplied.",
				example: "INVALID_EMAIL_OR_PASSWORD",
			},
			message: {
				type: "string",
				description: "A human-readable Better Auth error message.",
				example: "Invalid email or password.",
			},
		},
		required: ["message"],
	};

	for (const { path, operation } of operationEntries(document)) {
		operation.tags = operation.tags?.map((tag) => TAG_ALIASES[tag] ?? tag);
		operation.description ??= operation.summary
			? `${operation.summary}.`
			: "Perform this API operation.";
		const isPublic = path === "/health" || path.startsWith("/v1/calculators/");
		operation.security = isPublic ? [] : [{ apiKeyCookie: [] }];
		operation.parameters?.forEach((parameter) => {
			if (typeof parameter.description !== "string") {
				const name =
					typeof parameter.name === "string" ? parameter.name : "request";
				parameter.description = `The ${name} value for this request.`;
			}
		});
		if (operation.requestBody) {
			operation.requestBody.description ??=
				"The JSON payload required by this operation.";
		}

		operation.responses ??= {};
		if (!isPublic) {
			operation.responses["401"] ??= {
				$ref: "#/components/responses/Unauthorized",
			};
			operation.responses["429"] ??= {
				$ref: "#/components/responses/RateLimited",
			};
		}
		operation.responses["500"] ??= {
			$ref: "#/components/responses/InternalServerError",
		};
	}
}

function mergeAuthDocument(
	business: OpenApiDocument,
	authDocument: OpenApiDocument,
): void {
	business.components ??= {};
	business.components.schemas ??= {};
	const authSchemas = authDocument.components?.schemas ?? {};
	const schemaNames = new Map<string, string>();

	for (const name of Object.keys(authSchemas)) {
		schemaNames.set(
			name,
			Object.hasOwn(business.components.schemas, name) ? `Auth${name}` : name,
		);
	}

	const rewritten = rewriteRefs(authDocument, schemaNames) as OpenApiDocument;
	for (const [name, schema] of Object.entries(
		rewritten.components?.schemas ?? {},
	)) {
		business.components.schemas[schemaNames.get(name) ?? name] = schema;
	}

	const usedOperationIds = new Set(
		operationEntries(business).flatMap(({ operation }) =>
			operation.operationId ? [operation.operationId] : [],
		),
	);

	for (const [authPath, pathItem] of Object.entries(rewritten.paths)) {
		const mountedPath = `/v1/auth${authPath}`;
		if (business.paths[mountedPath]) {
			throw new Error(`OpenAPI path collision at ${mountedPath}`);
		}

		for (const method of HTTP_METHODS) {
			const value = pathItem[method];
			if (!value || typeof value !== "object") continue;
			const operation = value as Operation;
			const baseId =
				operation.operationId ?? generatedOperationId(method, authPath);
			let operationId = `auth${capitalize(baseId)}`;
			let suffix = 2;
			while (usedOperationIds.has(operationId)) {
				operationId = `auth${capitalize(baseId)}${suffix}`;
				suffix += 1;
			}
			usedOperationIds.add(operationId);
			operation.operationId = operationId;
			operation.summary ??= operation.description ?? `Call ${baseId}`;
			operation.description ??= operation.summary;
			operation.tags = authPath.startsWith("/organization/")
				? ["Organizations"]
				: ["Authentication"];
			operation.security = PUBLIC_AUTH_PATHS.has(authPath)
				? []
				: [{ apiKeyCookie: [] }];
			operation.responses ??= {};
			if (operation.requestBody) {
				operation.requestBody.description ??=
					"The JSON payload accepted by this authentication operation.";
			}
			operation.parameters?.forEach((parameter) => {
				if (typeof parameter.description !== "string") {
					const name =
						typeof parameter.name === "string" ? parameter.name : "request";
					parameter.description = `The ${name} value for this authentication request.`;
				}
			});
			if (
				!Object.keys(operation.responses).some((status) =>
					/^2\d\d$/.test(status),
				)
			) {
				operation.responses["200"] = {
					description: "The authentication operation completed successfully.",
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
						},
					},
				};
			}
			operation.responses["429"] ??= {
				$ref: "#/components/responses/RateLimited",
			};
			operation.responses["500"] ??= {
				$ref: "#/components/responses/InternalServerError",
			};
		}
		business.paths[mountedPath] = pathItem;
	}
}

function normalizeErrorResponses(document: OpenApiDocument): void {
	for (const { path, operation } of operationEntries(document)) {
		for (const [status, component] of Object.entries(
			ERROR_RESPONSE_BY_STATUS,
		)) {
			if (!operation.responses?.[status]) continue;
			const responseComponent =
				path.startsWith("/v1/auth") && !["429", "500", "503"].includes(status)
					? `Auth${component}`
					: component;
			operation.responses[status] = {
				$ref: `#/components/responses/${responseComponent}`,
			};
		}
	}
}

export async function buildOpenApiDocument(
	app: AppOpenAPI,
): Promise<OpenApiDocument> {
	const business = app.getOpenAPI31Document({
		openapi: "3.1.0",
		info: {
			title: API_NAME,
			version: API_VERSION,
			description: `${API_DESCRIPTION}\n\nAuthentication uses Better Auth session cookies. Browser clients must set credentials: "include". Node clients must persist cookies from Set-Cookie responses and resend them. Bearer authentication is not supported.`,
			license: {
				name: "Proprietary",
				identifier: "LicenseRef-Proprietary",
			} as unknown as { name: string },
		},
		servers: [
			{
				url: env.PUBLIC_BASE_URL ?? LOCAL_BASE_URL,
				description:
					env.NODE_ENV === "production" ? "Production" : "Local development",
			},
		],
	}) as unknown as OpenApiDocument;

	normalizeBusinessDocument(business);
	const authDocument =
		(await auth.api.generateOpenAPISchema()) as unknown as OpenApiDocument;
	mergeAuthDocument(business, authDocument);
	normalizeErrorResponses(business);
	convertNullableSchemas(business);
	documentSchemaProperties(business.components?.schemas);
	removeUnusedResponses(business);
	removeUnusedSchemas(business);
	return business;
}

export async function buildMoneyOpenApiDocument(
	app: AppOpenAPI,
): Promise<OpenApiDocument> {
	const document = structuredClone(await buildOpenApiDocument(app));
	for (const path of Object.keys(document.paths)) {
		if (path.startsWith("/v1/auth/")) delete document.paths[path];
	}
	document.info = {
		...(document.info as JsonObject),
		title: `${API_NAME} Money API`,
		description: `${API_DESCRIPTION}\n\nThis money-only contract excludes Better Auth operations. Authenticate with the official Better Auth client, then use credentials: "include" in browsers or persist cookies in Node clients.`,
	};
	document.tags = document.tags?.filter(
		(tag) => !["Authentication", "Organizations"].includes(tag.name),
	);
	removeUnusedResponses(document);
	removeUnusedSchemas(document);
	return document;
}
