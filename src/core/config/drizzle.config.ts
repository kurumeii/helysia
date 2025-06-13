import type { Config } from "drizzle-kit"
import { envConfig } from "./env.config.ts"

export default {
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: envConfig.DATABASE_URL,
	},
} satisfies Config
