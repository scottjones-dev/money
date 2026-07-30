// src/types/app.ts
import type {
	OpenAPIHono,
	RouteConfig,
	RouteHandler,
} from "@hono/zod-openapi";
import type { Logger } from "pino";

export interface AuthenticatedUser {
	id: string;
	email: string;
	name: string;
}

export interface AuthenticatedSession {
	id: string;
	userId: string;
	expiresAt: Date;
}

export interface AppVariables {
	requestId: string;
	logger: Logger;
	user: AuthenticatedUser | null;
	session: AuthenticatedSession | null;
}

export interface AppBindings {
	Variables: AppVariables;
}

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type AppRouteHandler<
	TRoute extends RouteConfig,
> = RouteHandler<TRoute, AppBindings>;