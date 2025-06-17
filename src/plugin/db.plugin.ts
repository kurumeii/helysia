import { envConfig } from "@config"
import * as schema from "@db"
import { drizzle } from "drizzle-orm/bun-sql"
import { Elysia } from "elysia"

export const dbPlugin = async () =>
	new Elysia({
		name: "plugin.db",
	}).decorate(
		"db",
		drizzle({
			connection: {
				url: envConfig.DATABASE_URL,
			},
			casing: "snake_case",
			logger: true,
			schema,
		})
	)
