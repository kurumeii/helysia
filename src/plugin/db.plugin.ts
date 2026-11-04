import { Elysia } from "elysia";
import { createDb } from "@/database/client.ts";

// A single instance (not a factory), so the whole app shares one connection pool.
export const dbPlugin = new Elysia({
	name: "plugin.db",
})
	.decorate("db", createDb())
	// Runs after `app.stop()` has stopped the server; release the pool.
	.onStop(async (app) => {
		await app.decorator.db.$client.close();
	});
