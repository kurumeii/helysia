import { Elysia } from "elysia";
import { createDb } from "@/database/client.ts";

export const dbPlugin = new Elysia({
	name: "plugin.db",
})
	.decorate("db", createDb())
	.onStop(async (app) => {
		await app.decorator.db.$client.close();
	});
