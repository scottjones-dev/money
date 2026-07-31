// scripts/export-openapi.ts
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import app from "../src/app";

const outputDirectory = resolve(process.cwd(), "openapi");
const outputFile = resolve(outputDirectory, "openapi.json");

const document = app.getOpenAPIDocument({
	openapi: "3.1.0",
	info: {
		title: "Alice Systems Money API",
		version: "0.1.0",
		description:
			"Household finance, budgeting, debt and UK benefit calculation API.",
	},
	servers: [
		{
			url: "https://api.alicesystems.co.uk",
			description: "Local development",
		},
	],
});

await mkdir(outputDirectory, {
	recursive: true,
});

await writeFile(outputFile, `${JSON.stringify(document, null, 2)}\n`, "utf8");

console.log(`OpenAPI document written to ${outputFile}`);
