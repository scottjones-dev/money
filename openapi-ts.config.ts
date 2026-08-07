import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
	input: "./openapi/money.openapi.json",
	output: {
		path: "./.tmp/sdk",
	},
	plugins: ["@hey-api/client-fetch", "@hey-api/typescript", "@hey-api/sdk"],
});
