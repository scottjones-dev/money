// scripts/export-openapi.ts
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import app from "../src/app";
import {
	buildMoneyOpenApiDocument,
	buildOpenApiDocument,
} from "../src/lib/openapi-document";

const outputDirectory = resolve(process.cwd(), "openapi");
const outputFile = resolve(outputDirectory, "openapi.json");
const moneyOutputFile = resolve(outputDirectory, "money.openapi.json");

const document = await buildOpenApiDocument(app);
const moneyDocument = await buildMoneyOpenApiDocument(app);

await mkdir(outputDirectory, {
	recursive: true,
});

await writeFile(
	outputFile,
	`${JSON.stringify(document, null, "\t")}\n`,
	"utf8",
);

await writeFile(
	moneyOutputFile,
	`${JSON.stringify(moneyDocument, null, "\t")}\n`,
	"utf8",
);

console.log(`OpenAPI document written to ${outputFile}`);
console.log(`Money-only OpenAPI document written to ${moneyOutputFile}`);
