import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const tag = process.env.GITHUB_REF_NAME ?? process.env.SDK_TAG ?? "";
const suppliedVersion = process.env.SDK_VERSION;
const tagMatch = /^sdk-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag);
const version = suppliedVersion ?? tagMatch?.[1];
if (!version)
	throw new Error(
		"Set SDK_VERSION or use a GitHub Release tag formatted sdk-vX.Y.Z.",
	);
if (tag && (!tagMatch || tagMatch[1] !== version))
	throw new Error(`Release tag ${tag} does not match SDK version ${version}.`);

const directory = resolve(process.cwd(), ".tmp/npm-package");
await mkdir(directory, { recursive: true });
await writeFile(
	resolve(directory, "package.json"),
	`${JSON.stringify(
		{
			name: "@alicesystems/money-sdk",
			version,
			description: "Typed Fetch SDK for the Alice Systems UK Money API.",
			type: "module",
			license: "UNLICENSED",
			files: ["dist", "README.md", "PROPRIETARY-NOTICE.txt"],
			sideEffects: false,
			main: "./dist/index.js",
			types: "./dist/index.d.ts",
			exports: {
				".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
				"./client": {
					types: "./dist/client.gen.d.ts",
					import: "./dist/client.gen.js",
				},
			},
			publishConfig: { access: "public", provenance: true },
			repository: {
				type: "git",
				url: "git+https://github.com/scottjones-dev/money.git",
			},
			engines: { node: ">=20" },
		},
		null,
		2,
	)}\n`,
	"utf8",
);
await writeFile(
	resolve(directory, "README.md"),
	`# @alicesystems/money-sdk\n\nTyped Fetch client for the Alice Systems Money API. Authentication is handled separately with Better Auth. Browser callers must configure \`credentials: "include"\`; Node callers must persist and resend session cookies.\n`,
	"utf8",
);
await writeFile(
	resolve(directory, "PROPRIETARY-NOTICE.txt"),
	"Copyright Alice Systems. All rights reserved. This package is proprietary software and is not licensed for redistribution or modification except under a separate written agreement.\n",
	"utf8",
);
console.log(`Prepared @alicesystems/money-sdk@${version} in ${directory}`);
