import { afterAll, describe, expect, test } from "bun:test";
import { HX, ROUTES } from "@/shared/routes.ts";
import {
	call,
	cleanupUsers,
	password,
	registerUser,
	sessionCookie,
} from "./helpers.ts";

afterAll(cleanupUsers);

describe("auth", () => {
	test("guests are redirected to login", async () => {
		const res = await call(ROUTES.todos);
		expect(res.status).toBe(302);
		expect(res.headers.get("location")).toBe(ROUTES.login);
	});

	test("htmx guests get 401 and an HX-Redirect", async () => {
		const res = await call(ROUTES.todos, { htmx: true });
		expect(res.status).toBe(401);
		expect(res.headers.get(HX.redirect)).toBe(ROUTES.login);
	});

	test("register starts a session and rejects a duplicate username", async () => {
		const { username, cookie } = await registerUser();
		expect(cookie.startsWith("session=")).toBe(true);

		const duplicate = await call(ROUTES.register, {
			method: "POST",
			json: { username, password },
		});
		expect(duplicate.status).toBe(409);
	});

	test("login accepts the right password and rejects a wrong one", async () => {
		const { username } = await registerUser();

		const ok = await call(ROUTES.login, {
			method: "POST",
			json: { username, password },
		});
		expect(ok.status).toBe(200);
		expect(ok.headers.get(HX.redirect)).toBe(ROUTES.todos);
		expect(sessionCookie(ok).startsWith("session=")).toBe(true);

		const wrong = await call(ROUTES.login, {
			method: "POST",
			json: { username, password: `${password}x` },
		});
		expect(wrong.status).toBe(401);
	});
});
