// src/types/app.ts
import type {
	OpenAPIHono,
	RouteConfig,
	RouteHandler,
} from "@hono/zod-openapi";
import type { Logger } from "pino";

import type { auth } from "@/lib/auth";

export type AuthenticatedUser =
	typeof auth.$Infer.Session.user;

export type AuthenticatedSession =
	typeof auth.$Infer.Session.session;

export type HouseholdRole =
	| "owner"
	| "admin"
	| "member"
	| "viewer";

export interface HouseholdContext {
	id: string;
	organizationId: string;
	name: string;
	role: HouseholdRole;
}

export interface AppVariables {
	requestId: string;
	logger: Logger;

	user: AuthenticatedUser | null;
	session: AuthenticatedSession | null;

	household: HouseholdContext | null;
}

export interface AppBindings {
	Variables: AppVariables;
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<
	TRoute extends RouteConfig,
> = RouteHandler<TRoute, AppBindings>;