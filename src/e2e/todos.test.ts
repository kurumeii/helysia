import { afterAll, describe, expect, test } from "bun:test";
import { users } from "@db";
import { inArray } from "drizzle-orm";
import { app } from "@/app.ts";
import { createDb } from "@/database/client.ts";
import { HX, ROUTES, todoPath } from "@/shared/routes.ts";

type Options = {
	method?: string;
	cookie?: string;
	htmx?: boolean;
	json?: unknown;
};

const call = (
	path: string,
	{ method = "GET", cookie, htmx, json }: Options = {},
) => {
	const headers = new Headers();
	if (cookie) headers.set("cookie", cookie);
	if (htmx) headers.set(HX.request, "true");
	if (json !== undefined) headers.set("content-type", "application/json");
	return app.handle(
		new Request(`http://localhost${path}`, {
			method,
			headers,
			body: json === undefined ? undefined : JSON.stringify(json),
		}),
	);
};

const sessionCookie = (res: Response) => {
	const raw = res.headers
		.getSetCookie()
		.find((cookie) => cookie.startsWith("session="));
	if (!raw) throw new Error("response has no session cookie");
	return raw.split(";")[0] ?? raw;
};

const db = createDb();
const createdUsernames: string[] = [];
const password = crypto.randomUUID();

const registerUser = async () => {
	const username = `e2e_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
	createdUsernames.push(username);
	const res = await call(ROUTES.register, {
		method: "POST",
		json: { username, password },
	});
	expect(res.status).toBe(200);
	return { username, cookie: sessionCookie(res) };
};

const uniqueTitle = (label: string) => `${label} ${crypto.randomUUID()}`;

const createTodo = async (cookie: string, title: string) => {
	const res = await call(ROUTES.todos, {
		method: "POST",
		cookie,
		json: { title },
	});
	expect(res.status).toBe(200);
	const html = await res.text();
	const id = /id="todo-([0-9a-f-]{36})"/.exec(html)?.[1];
	if (!id) throw new Error(`no todo id in response: ${html}`);
	return { id, html };
};

const isChecked = (html: string) => /<input[^>]*\bchecked\b/.test(html);

const MISSING_ID = "01a1a9da-bc60-724f-b629-40f63e7cbb48";

afterAll(async () => {
	if (createdUsernames.length > 0) {
		await db.delete(users).where(inArray(users.username, createdUsernames));
	}
	await db.$client.close();
});

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

describe("todos", () => {
	test("create, list, toggle, rename and delete", async () => {
		const { cookie } = await registerUser();
		const title = uniqueTitle("Buy milk");
		const { id, html } = await createTodo(cookie, title);
		expect(html).toContain(title);
		expect(isChecked(html)).toBe(false);

		const list = await call(ROUTES.todos, { cookie });
		expect(list.status).toBe(200);
		expect(await list.text()).toContain(`id="todo-${id}"`);

		const toggled = await call(todoPath(id, "toggle"), {
			method: "PATCH",
			cookie,
		});
		expect(toggled.status).toBe(200);
		expect(isChecked(await toggled.text())).toBe(true);

		const toggledBack = await call(todoPath(id, "toggle"), {
			method: "PATCH",
			cookie,
		});
		expect(isChecked(await toggledBack.text())).toBe(false);

		const newTitle = uniqueTitle("Buy oat milk");
		const renamed = await call(todoPath(id), {
			method: "PUT",
			cookie,
			json: { title: newTitle },
		});
		expect(renamed.status).toBe(200);
		expect(await renamed.text()).toContain(newTitle);

		const edit = await call(todoPath(id, "edit"), { cookie });
		expect(edit.status).toBe(200);
		expect(await edit.text()).toContain(newTitle);

		const removed = await call(todoPath(id), { method: "DELETE", cookie });
		expect(removed.status).toBe(200);

		const gone = await call(todoPath(id), { cookie });
		expect(gone.status).toBe(404);
		expect(await gone.text()).toBe("Todo not found");

		const removedAgain = await call(todoPath(id), {
			method: "DELETE",
			cookie,
		});
		expect(removedAgain.status).toBe(404);
	});

	test("a missing todo returns 404 for every operation", async () => {
		const { cookie } = await registerUser();
		const requests: [string, string, unknown?][] = [
			["GET", todoPath(MISSING_ID)],
			["GET", todoPath(MISSING_ID, "edit")],
			["PUT", todoPath(MISSING_ID), { title: "x" }],
			["PATCH", todoPath(MISSING_ID, "toggle")],
			["DELETE", todoPath(MISSING_ID)],
		];

		for (const [method, path, json] of requests) {
			const res = await call(path, { method, cookie, json });
			expect(res.status).toBe(404);
			expect(await res.text()).toBe("Todo not found");
		}
	});

	test("another user's todo looks the same as a missing one", async () => {
		const owner = await registerUser();
		const other = await registerUser();
		const title = uniqueTitle("Private");
		const { id } = await createTodo(owner.cookie, title);

		const requests: [string, string, unknown?][] = [
			["GET", todoPath(id)],
			["GET", todoPath(id, "edit")],
			["PUT", todoPath(id), { title: "hijacked" }],
			["PATCH", todoPath(id, "toggle")],
			["DELETE", todoPath(id)],
		];

		for (const [method, path, json] of requests) {
			const res = await call(path, { method, cookie: other.cookie, json });
			expect(res.status).toBe(404);
			expect(await res.text()).toBe("Todo not found");
		}

		const otherList = await call(ROUTES.todos, { cookie: other.cookie });
		expect(await otherList.text()).not.toContain(title);

		const stillThere = await call(todoPath(id), { cookie: owner.cookie });
		expect(stillThere.status).toBe(200);
		expect(await stillThere.text()).toContain(title);
	});

	test("titles are HTML-escaped", async () => {
		const { cookie } = await registerUser();
		const { html } = await createTodo(cookie, "<script>alert(1)</script>");
		expect(html).toContain("&lt;script&gt;");
		expect(html).not.toContain("<script>alert(1)");
	});
});

describe("validation", () => {
	test("a malformed todo id is rejected", async () => {
		const { cookie } = await registerUser();
		const res = await call(todoPath("not-a-uuid"), { cookie });
		expect(res.status).toBe(422);
	});

	test("an htmx request with invalid input gets the alert fragment", async () => {
		const { cookie } = await registerUser();
		const res = await call(todoPath("not-a-uuid"), { cookie, htmx: true });
		expect(res.status).toBe(422);
		expect(await res.text()).toContain("Invalid input");
	});

	test("an empty or oversized title is rejected", async () => {
		const { cookie } = await registerUser();
		for (const title of ["", "x".repeat(201)]) {
			const res = await call(ROUTES.todos, {
				method: "POST",
				cookie,
				json: { title },
			});
			expect(res.status).toBe(422);
		}
	});

	test("an unknown route returns 404", async () => {
		const res = await call("/no-such-route");
		expect(res.status).toBe(404);
	});
});
