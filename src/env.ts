import "dotenv/config";

import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
    server: {
        NODE_ENV: z
            .enum(["development", "test", "production"])
            .default("development"),

        PORT: z.coerce.number().int().positive().default(9000),

        DATABASE_URL: z.url(),

        BETTER_AUTH_URL: z.url(),

        BETTER_AUTH_SECRET: z.string().min(32),
    },

    runtimeEnv: process.env,

    emptyStringAsUndefined: true,
});