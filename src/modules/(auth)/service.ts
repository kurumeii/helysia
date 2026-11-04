import { users } from "@db";
import { dbPlugin } from "@plugin";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import type { Db } from "@/database/client.ts";

// Verified against a throwaway hash when the username does not exist, so
// response time does not reveal which usernames are registered.
const DUMMY_HASH = await Bun.password.hash("not-a-real-password");

// Business logic bound to a db handle. It takes and returns plain values and
// knows nothing about HTTP: controllers decide status codes, cookies and markup.
export const createAuthService = (db: Db) => ({
	/** Returns the user when the credentials are valid, otherwise `null`. */
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

	/**
	 * Creates a user with an argon2id password hash (Bun default).
	 * Returns `null` when the username is already taken.
	 */
	register: async (username: string, password: string) => {
		const hash = await Bun.password.hash(password);

		// ON CONFLICT DO NOTHING: a duplicate username returns no row (race-free).
		const [row] = await db
			.insert(users)
			.values({ username, password: hash })
			.onConflictDoNothing({ target: users.username })
			.returning({ id: users.id, username: users.username });

		return row ?? null;
	},
});

// Gives any controller that `.use`s it an `authService` in its context.
export const AuthService = new Elysia({ name: "Auth.Service" })
	.use(dbPlugin)
	.derive({ as: "scoped" }, ({ db }) => ({
		authService: createAuthService(db),
	}));
