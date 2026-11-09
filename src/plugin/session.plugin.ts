import { sessions, users } from "@db";
import convert from "convert";
import { and, eq, gt, lt } from "drizzle-orm";
import { Elysia } from "elysia";
import { dbPlugin } from "./db.plugin.ts";

export const REMEMBER_TTL_SECONDS = convert(30, "days").to("seconds");

const TOKEN_BYTES = 32;

const generateToken = () =>
	Buffer.from(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))).toString(
		"hex",
	);

export const hashToken = (token: string) =>
	new Bun.CryptoHasher("sha256").update(token).digest("hex");

const expiresAt = () => new Date(Date.now() + REMEMBER_TTL_SECONDS * 1000);

export const SessionService = new Elysia({ name: "Session.Service" })
	.use(dbPlugin)
	.derive({ as: "global" }, ({ db }) => ({
		createSession: async (userId: string) => {
			const token = generateToken();
			await db.insert(sessions).values({
				user_id: userId,
				token_hash: hashToken(token),
				expires_at: expiresAt(),
			});
			return token;
		},

		rotateSession: async (tokenHash: string) => {
			const [row] = await db
				.select({
					id: sessions.id,
					user_id: sessions.user_id,
					username: users.username,
				})
				.from(sessions)
				.innerJoin(users, eq(users.id, sessions.user_id))
				.where(
					and(
						eq(sessions.token_hash, tokenHash),
						gt(sessions.expires_at, new Date()),
					),
				);

			if (!row) return null;

			const token = generateToken();
			await db
				.update(sessions)
				.set({
					token_hash: hashToken(token),
					expires_at: expiresAt(),
				})
				.where(eq(sessions.id, row.id));

			await db
				.delete(sessions)
				.where(
					and(
						eq(sessions.user_id, row.user_id),
						lt(sessions.expires_at, new Date()),
					),
				);

			return {
				token,
				user: { id: row.user_id, username: row.username },
			};
		},

		revokeSession: async (tokenHash: string) => {
			await db.delete(sessions).where(eq(sessions.token_hash, tokenHash));
		},
	}));
