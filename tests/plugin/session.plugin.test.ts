import { afterAll, describe, expect, test } from "bun:test";
import { createEnv } from "@config";
import { sessions, users } from "@db";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { createDb } from "@/database/client.ts";
import {
	hashToken,
	REMEMBER_TTL_SECONDS,
	SessionService,
} from "@/plugin/session.plugin.ts";

const db = createDb(createEnv());

const username = `unit_session_${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
const [created] = await db
	.insert(users)
	.values({ username, password: "unused-by-session-tests" })
	.returning();

if (!created) throw new Error("failed to create the session test user");
const user = created;

const app = new Elysia()
	.use(SessionService)
	.post(
		"/create",
		async ({ body, createSession }) => ({
			token: await createSession(body.userId),
		}),
		{ body: t.Object({ userId: t.String() }) },
	)
	.post(
		"/rotate",
		async ({ body, rotateSession }) => ({
			result: await rotateSession(body.hash),
		}),
		{ body: t.Object({ hash: t.String() }) },
	)
	.post(
		"/revoke",
		async ({ body, revokeSession }) => {
			await revokeSession(body.hash);
			return { ok: true };
		},
		{ body: t.Object({ hash: t.String() }) },
	);

type Rotated = {
	token: string;
	user: { id: string; username: string };
};

const post = async <T>(path: string, body: object) => {
	const res = await app.handle(
		new Request(`http://localhost${path}`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
	expect(res.status).toBe(200);
	return (await res.json()) as T;
};

const create = (userId = user.id) =>
	post<{ token: string }>("/create", { userId }).then(({ token }) => token);

const rotate = (hash: string) =>
	post<{ result: Rotated | null }>("/rotate", { hash }).then(
		({ result }) => result,
	);

const revoke = (hash: string) => post("/revoke", { hash });

const rowsFor = (token: string) =>
	db
		.select()
		.from(sessions)
		.where(eq(sessions.token_hash, hashToken(token)));

afterAll(async () => {
	await db.delete(users).where(eq(users.username, username));
	await db.$client.close();
});

describe("SessionService", () => {
	test("stores only a hash of the issued token and a 30-day expiry", async () => {
		const token = await create();
		expect(token).toMatch(/^[0-9a-f]{64}$/);

		const [row] = await rowsFor(token);
		expect(row).toBeDefined();
		expect(row?.token_hash).not.toBe(token);
		expect(row?.user_id).toBe(user.id);

		const plain = await db
			.select()
			.from(sessions)
			.where(eq(sessions.token_hash, token));
		expect(plain).toHaveLength(0);

		const days = ((row?.expires_at.getTime() ?? 0) - Date.now()) / 86_400_000;
		expect(days).toBeCloseTo(REMEMBER_TTL_SECONDS / 86_400, 1);
	});

	test("rotates a live token in place and returns the DB username", async () => {
		const token = await create();

		const rotated = await rotate(hashToken(token));
		expect(rotated?.token).toBeDefined();
		expect(rotated?.token).not.toBe(token);
		expect(rotated?.user).toEqual({ id: user.id, username });

		expect(await rowsFor(token)).toHaveLength(0);
		expect(await rowsFor(rotated?.token ?? "")).toHaveLength(1);
	});

	test("replaying a rotated-away token is rejected", async () => {
		const token = await create();
		const rotated = await rotate(hashToken(token));

		expect(rotated).not.toBeNull();
		expect(await rotate(hashToken(token))).toBeNull();
	});

	test("rejects an unknown token hash", async () => {
		expect(await rotate(hashToken(crypto.randomUUID()))).toBeNull();
	});

	test("rejects an expired session", async () => {
		const token = await create();
		await db
			.update(sessions)
			.set({ expires_at: new Date(Date.now() - 1_000) })
			.where(eq(sessions.token_hash, hashToken(token)));

		expect(await rotate(hashToken(token))).toBeNull();
	});

	test("sweeps the user's expired siblings on a successful rotation", async () => {
		const live = await create();
		const stale = await create();
		await db
			.update(sessions)
			.set({ expires_at: new Date(Date.now() - 1_000) })
			.where(eq(sessions.token_hash, hashToken(stale)));

		const rotated = await rotate(hashToken(live));

		expect(rotated).not.toBeNull();
		expect(await rowsFor(stale)).toHaveLength(0);
		expect(await rowsFor(rotated?.token ?? "")).toHaveLength(1);
	});

	test("revokes exactly one session and leaves the others usable", async () => {
		const first = await create();
		const second = await create();

		await revoke(hashToken(first));

		expect(await rowsFor(first)).toHaveLength(0);
		expect(await rowsFor(second)).toHaveLength(1);
		expect(await rotate(hashToken(first))).toBeNull();
		expect(await rotate(hashToken(second))).not.toBeNull();
	});

	test("deleting the user cascades their sessions", async () => {
		const [temporary] = await db
			.insert(users)
			.values({
				username: `${username}_cascade`,
				password: "unused-by-session-tests",
			})
			.returning();
		if (!temporary) throw new Error("failed to create the cascade test user");
		await create(temporary.id);

		await db.delete(users).where(eq(users.id, temporary.id));

		const remaining = await db
			.select()
			.from(sessions)
			.where(eq(sessions.user_id, temporary.id));
		expect(remaining).toHaveLength(0);
	});
});
