import { afterAll, describe, expect, test } from "bun:test";
import { HX, ROUTES } from "@/shared/routes.ts";
import {
	call,
	cleanupUsers,
	password,
	registerUser,
	rememberCookie,
	sessionCookie,
	signSessionCookie,
} from "./helpers.ts";

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const expectGuest = async (cookie: string) => {
	const res = await call(ROUTES.todos, { cookie });
	expect(res.status).toBe(302);
	expect(res.headers.get("location")).toBe(ROUTES.login);
};

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

describe("logout", () => {
	test("clears the session cookie and redirects home", async () => {
		const { cookie } = await registerUser();
		const res = await call(ROUTES.logout, { method: "POST", cookie });
		expect(res.status).toBe(200);
		expect(res.headers.get(HX.redirect)).toBe(ROUTES.home);

		const cleared = res.headers
			.getSetCookie()
			.find((header) => header.startsWith("session="));
		expect(cleared).toStartWith("session=;");
		expect(cleared).toContain("Max-Age=0");
	});

	test("is POST only, so a link cannot log a user out", async () => {
		const { cookie } = await registerUser();
		const res = await call(ROUTES.logout, { cookie });
		expect(res.status).toBe(404);
	});
});

describe("session cookie", () => {
	test("a correctly signed, unexpired token is accepted", async () => {
		const cookie = await signSessionCookie({ exp: nowInSeconds() + 60 });
		const res = await call(ROUTES.todos, { cookie });
		expect(res.status).toBe(200);
	});

	test("garbage is treated as a guest", async () => {
		await expectGuest("session=garbage");
	});

	test("a tampered signature is treated as a guest", async () => {
		const { cookie } = await registerUser();
		const [header, payload, signature] = cookie
			.slice("session=".length)
			.split(".");
		const first = signature?.[0] === "A" ? "B" : "A";
		await expectGuest(
			`session=${header}.${payload}.${first}${signature?.slice(1)}`,
		);
	});

	test("a token signed with another secret is treated as a guest", async () => {
		const cookie = await signSessionCookie({
			secret: crypto.randomUUID(),
			exp: nowInSeconds() + 60,
		});
		await expectGuest(cookie);
	});

	test("an expired token is treated as a guest", async () => {
		const cookie = await signSessionCookie({ exp: nowInSeconds() - 60 });
		await expectGuest(cookie);
	});
});

describe("remember me", () => {
	const loginRemembered = async () => {
		const { username } = await registerUser();
		const res = await call(ROUTES.login, {
			method: "POST",
			json: { username, password, remember: true },
		});
		expect(res.status).toBe(200);
		return { username, res, cookie: rememberCookie(res) };
	};

	test("login with remember issues a persistent remember cookie", async () => {
		const { res, cookie } = await loginRemembered();

		expect(sessionCookie(res).startsWith("session=")).toBe(true);
		expect(cookie.startsWith("remember=")).toBe(true);

		const header = res.headers
			.getSetCookie()
			.find((value) => value.startsWith("remember="));
		expect(header).toContain("HttpOnly");
		expect(header).toContain("Max-Age=2592000");
	});

	test("login without remember issues only the session cookie", async () => {
		const { username } = await registerUser();
		const res = await call(ROUTES.login, {
			method: "POST",
			json: { username, password },
		});

		expect(res.status).toBe(200);
		expect(
			res.headers
				.getSetCookie()
				.some((cookie) => cookie.startsWith("remember=")),
		).toBe(false);
	});

	test("accepts the checkbox's string value", async () => {
		const { username } = await registerUser();
		const res = await call(ROUTES.login, {
			method: "POST",
			json: { username, password, remember: "true" },
		});

		expect(res.status).toBe(200);
		expect(rememberCookie(res).startsWith("remember=")).toBe(true);
	});

	test("a remembered guest is revived and the token is rotated", async () => {
		const { cookie } = await loginRemembered();

		const revived = await call(ROUTES.todos, { cookie });
		expect(revived.status).toBe(200);
		expect(sessionCookie(revived).startsWith("session=")).toBe(true);

		const rotated = rememberCookie(revived);
		expect(rotated).not.toBe(cookie);

		await expectGuest(cookie);
	});

	test("a tampered remember token is treated as a guest", async () => {
		const { cookie } = await loginRemembered();
		const index = cookie.length - 1;
		const tampered = `${cookie.slice(0, index)}${cookie[index] === "a" ? "b" : "a"}`;

		await expectGuest(tampered);
	});

	test("logout revokes the remember token", async () => {
		const { cookie } = await loginRemembered();

		const res = await call(ROUTES.logout, { method: "POST", cookie });
		expect(res.status).toBe(200);

		const cleared = res.headers
			.getSetCookie()
			.find((header) => header.startsWith("remember="));
		expect(cleared).toStartWith("remember=;");
		expect(cleared).toContain("Max-Age=0");

		await expectGuest(cookie);
	});
});
