import { envConfig } from "@config";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./index.ts";

export const createDb = () =>
	drizzle({
		connection: {
			url: envConfig.DATABASE_URL,
		},
		casing: "snake_case",
		logger: envConfig.NODE_ENV !== "production",
		schema,
	});

export type Db = ReturnType<typeof createDb>;
