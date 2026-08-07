import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { relations } from "@/db/relations";
import { env } from "@/env";

export const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: env.NODE_ENV === "production" ? 10 : 5,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 10_000,
	ssl: env.DATABASE_SSL
		? {
				rejectUnauthorized: false,
			}
		: undefined,
});

export const db = drizzle({
	client: pool,
	relations,
});

export type Database = typeof db;
