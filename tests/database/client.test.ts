import { describe, expect, test } from "bun:test";
import { createEnv } from "@config";
import { sql } from "drizzle-orm";
import { createDb } from "@/database/client.ts";

const unreachable = {
	DATABASE_URL: "postgres://user:pass@127.0.0.1:1/app",
	NODE_ENV: "test",
} as const;

describe("createDb", () => {
	test("connects with the configured DATABASE_URL and answers a query", async () => {
		const db = createDb(createEnv());
		try {
			const rows = await db.execute(sql`select 1 as ok`);
			expect(rows).toEqual([{ ok: 1 }]);
		} finally {
			await db.$client.close();
		}
	});

	test("rejects a query when the database is unreachable", async () => {
		const db = createDb(unreachable);
		try {
			await expect(
				Promise.resolve(db.execute(sql`select 1`)),
			).rejects.toThrow();
		} finally {
			await db.$client.close();
		}
	});

	test("creates the client without connecting until the first query", async () => {
		const db = createDb(unreachable);
		expect(db.$client).toBeDefined();
		await db.$client.close();
	});
});
