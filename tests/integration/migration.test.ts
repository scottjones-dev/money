import { resolve } from "node:path";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let container: Awaited<ReturnType<PostgreSqlContainer["start"]>>;
let pool: Pool;

describe("database migrations", () => {
	beforeAll(async () => {
		container = await new PostgreSqlContainer("postgres:17-alpine").start();
		pool = new Pool({ connectionString: container.getConnectionUri() });
	});

	afterAll(async () => {
		await pool?.end();
		await container?.stop();
	});

	it("applies the baseline to an empty PostgreSQL database", async () => {
		const database = drizzle({ client: pool });

		await migrate(database, {
			migrationsFolder: resolve(process.cwd(), "src/db/migration"),
		});

		const result = await pool.query<{ name: string }>(`
			select table_name as name
			from information_schema.tables
			where table_schema = 'public'
		`);
		const tables = new Set(result.rows.map((row) => row.name));

		for (const expected of [
			"user",
			"organization",
			"households",
			"household_members",
			"income_sources",
			"expenses",
			"debts",
			"assets",
			"debt_payments",
			"calculations",
			"employments",
			"pensions",
			"financial_records",
		]) {
			expect(tables.has(expected), `missing table ${expected}`).toBe(true);
		}
	});
});
