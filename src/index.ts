import "hono";
import app from "@/app";

// Vercel's Hono runtime discovers this module and invokes the Fetch handler.
// The explicit package import keeps framework detection deterministic.
export type { AppType } from "@/app";

export default app;
