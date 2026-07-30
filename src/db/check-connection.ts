// src/db/check-connection.ts
import { pool } from "@/lib/database";

async function main(): Promise<void> {
	const result = await pool.query<{
		database_time: Date;
	}>("select now() as database_time");

	console.log("Database connected:", result.rows[0]);
}

main()
	.catch((error: unknown) => {
		console.error("Database connection failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await pool.end();
	});