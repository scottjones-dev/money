import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sdkDirectory = resolve(process.cwd(), ".tmp/sdk");

async function directoryHash(directory: string): Promise<string> {
	const hash = createHash("sha256");
	const entries = await readdir(directory, {
		recursive: true,
		withFileTypes: true,
	});
	const files = entries
		.filter((entry) => entry.isFile())
		.map((entry) => resolve(entry.parentPath, entry.name))
		.sort();
	for (const file of files) {
		hash.update(file.slice(directory.length).replaceAll("\\", "/"));
		hash.update(await readFile(file));
	}
	return hash.digest("hex");
}

const firstHash = await directoryHash(sdkDirectory);
const pnpmCli = process.env.npm_execpath;
if (!pnpmCli)
	throw new Error("npm_execpath is required to rerun SDK generation");
execFileSync(process.execPath, [pnpmCli, "exec", "openapi-ts", "--silent"], {
	cwd: process.cwd(),
	stdio: "inherit",
});
const secondHash = await directoryHash(sdkDirectory);

if (firstHash !== secondHash) {
	throw new Error("SDK generation is not deterministic");
}

console.log(`SDK generation is deterministic (${secondHash.slice(0, 12)}).`);
