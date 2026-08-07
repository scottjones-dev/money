import type { Hono } from "hono";
import app from "@/app";

// Vercel's Hono runtime discovers this module and invokes the Fetch handler.
// The explicit type import also keeps framework detection deterministic.
export type VercelHonoRuntime = Hono;

export default app;
