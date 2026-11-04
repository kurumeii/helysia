import { users } from "@db";
import { dbPlugin } from "@plugin";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import type { Db } from "@/database/client.ts";

// Verified against a throwaway hash when the username does not exist, so
// response time does not reveal which usernames are registered.
const DUMMY_HASH = await Bun.password.hash("not-a-real-password");

export const createAuthService = (db: Db) => ({
	authenticate: async (username: string, password: string) => {
		const [row] = await db
			.select()
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		const valid = await Bun.password.verify(
			password,
			row?.password ?? DUMMY_HASH,
		);
		return row && valid ? { id: row.id, username: row.username } : null;
	},

	register: async (username: string, password: string) => {
		const hash = await Bun.password.hash(password);

		const [row] = await db
			.insert(users)
			.values({ username, password: hash })
			.onConflictDoNothing({ target: users.username })
			.returning({ id: users.id, username: users.username });

		return row ?? null;
	},
});

export const AuthService = new Elysia({ name: "Auth.Service" })
	.use(dbPlugin)
	.derive({ as: "scoped" }, ({ db }) => ({
		authService: createAuthService(db),
	}));
