import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readMigrationFiles } from "drizzle-orm/migrator";

import { pool } from "../src/lib/database";

const CONFIRMATION = "ADOPT_EXISTING_SCHEMA";

if (process.env.BASELINE_CONFIRM !== CONFIRMATION) {
	throw new Error(
		`Refusing to adopt the baseline. Set BASELINE_CONFIRM=${CONFIRMATION} after backing up and verifying the target database.`,
	);
}

interface SnapshotEntry {
	entityType: "tables" | "columns" | "indexes" | "fks" | "pks" | "enums";
	schema: string;
	name: string;
	table?: string;
	notNull?: boolean;
	values?: string[];
}

interface Snapshot {
	ddl: SnapshotEntry[];
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(scriptDirectory, "../src/db/migration");
const [baseline] = readMigrationFiles({ migrationsFolder });

if (!baseline) {
	throw new Error("No baseline migration was found.");
}

const snapshotPath = resolve(migrationsFolder, baseline.name, "snapshot.json");
const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as Snapshot;

function key(entry: Pick<SnapshotEntry, "schema" | "table" | "name">) {
	return `${entry.schema}.${entry.table ? `${entry.table}.` : ""}${entry.name}`;
}

function assertExpected(
	label: string,
	expected: SnapshotEntry[],
	actual: Set<string>,
): void {
	const missing = expected.map(key).filter((value) => !actual.has(value));

	if (missing.length > 0) {
		throw new Error(
			`Baseline verification failed; missing ${label}: ${missing.join(", ")}`,
		);
	}
}

const client = await pool.connect();

try {
	await client.query("begin");
	await client.query(
		"select pg_advisory_xact_lock(hashtext('money-api-baseline-adoption'))",
	);

	const [tables, columns, indexes, constraints, enumRows] = await Promise.all([
		client.query<{ schema: string; name: string }>(`
			select table_schema as schema, table_name as name
			from information_schema.tables
			where table_type = 'BASE TABLE'
		`),
		client.query<{
			schema: string;
			table: string;
			name: string;
			not_null: boolean;
		}>(`
			select table_schema as schema, table_name as "table", column_name as name,
				(is_nullable = 'NO') as not_null
			from information_schema.columns
		`),
		client.query<{ schema: string; table: string; name: string }>(`
			select schemaname as schema, tablename as "table", indexname as name
			from pg_indexes
		`),
		client.query<{ schema: string; table: string; name: string }>(`
			select constraint_schema as schema, table_name as "table", constraint_name as name
			from information_schema.table_constraints
			where constraint_type in ('PRIMARY KEY', 'FOREIGN KEY')
		`),
		client.query<{ schema: string; name: string; value: string }>(`
			select namespace.nspname as schema, type.typname as name, enum.enumlabel as value
			from pg_type type
			join pg_namespace namespace on namespace.oid = type.typnamespace
			join pg_enum enum on enum.enumtypid = type.oid
			order by namespace.nspname, type.typname, enum.enumsortorder
		`),
	]);

	assertExpected(
		"tables",
		snapshot.ddl.filter((entry) => entry.entityType === "tables"),
		new Set(tables.rows.map(key)),
	);

	const actualColumns = new Map(
		columns.rows.map((entry) => [key(entry), entry.not_null]),
	);
	const expectedColumns = snapshot.ddl.filter(
		(entry) => entry.entityType === "columns",
	);
	assertExpected("columns", expectedColumns, new Set(actualColumns.keys()));

	const nullabilityMismatches = expectedColumns
		.filter((entry) => actualColumns.get(key(entry)) !== entry.notNull)
		.map(key);
	if (nullabilityMismatches.length > 0) {
		throw new Error(
			`Baseline verification failed; column nullability differs: ${nullabilityMismatches.join(", ")}`,
		);
	}

	assertExpected(
		"indexes",
		snapshot.ddl.filter((entry) => entry.entityType === "indexes"),
		new Set(indexes.rows.map(key)),
	);
	assertExpected(
		"constraints",
		snapshot.ddl.filter(
			(entry) => entry.entityType === "fks" || entry.entityType === "pks",
		),
		new Set(constraints.rows.map(key)),
	);

	const actualEnums = new Map<string, string[]>();
	for (const row of enumRows.rows) {
		const enumKey = key(row);
		actualEnums.set(enumKey, [...(actualEnums.get(enumKey) ?? []), row.value]);
	}
	const enumMismatches = snapshot.ddl
		.filter((entry) => entry.entityType === "enums")
		.filter(
			(entry) =>
				JSON.stringify(actualEnums.get(key(entry))) !==
				JSON.stringify(entry.values),
		)
		.map(key);
	if (enumMismatches.length > 0) {
		throw new Error(
			`Baseline verification failed; enum values differ: ${enumMismatches.join(", ")}`,
		);
	}

	await client.query('create schema if not exists "drizzle"');
	await client.query(`
		create table if not exists "drizzle"."__drizzle_migrations" (
			id serial primary key,
			hash text not null,
			created_at bigint,
			name text,
			applied_at timestamp with time zone default now()
		)
	`);

	const existing = await client.query<{ hash: string; name: string | null }>(
		'select hash, name from "drizzle"."__drizzle_migrations"',
	);
	if (
		existing.rows.some(
			(row) => row.hash === baseline.hash && row.name === baseline.name,
		)
	) {
		await client.query("commit");
		console.log(`Baseline ${baseline.name} was already adopted.`);
	} else {
		if (existing.rowCount && existing.rowCount > 0) {
			throw new Error(
				"Migration history already exists but does not contain this baseline.",
			);
		}

		await client.query(
			'insert into "drizzle"."__drizzle_migrations" (hash, created_at, name) values ($1, $2, $3)',
			[baseline.hash, baseline.folderMillis, baseline.name],
		);
		await client.query("commit");
		console.log(`Adopted baseline ${baseline.name}.`);
	}
} catch (error) {
	await client.query("rollback");
	throw error;
} finally {
	client.release();
	await pool.end();
}
