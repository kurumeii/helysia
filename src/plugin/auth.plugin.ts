import { envConfig } from "@config";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionUser = {
	id: number;
	username: string;
};

/**
 * Cookie-based JWT authentication.
 *
 * - `user`: the signed-in user, or `null` (available on every route after this plugin).
 * - `startSession(user)` / `endSession()`: set or clear the session cookie.
 * - Use `requireAuth()` (below) to protect routes.
 *
 * The token is stateless: it cannot be revoked before it expires.
 */
export const authPlugin = () =>
	new Elysia({
		name: "plugin.auth",
	})
		.use(
			jwt({
				name: "jwt",
				secret: envConfig.JWT_SECRET,
				schema: t.Object({
					userId: t.String(),
					username: t.String(),
				}),
			}),
		)
		.derive({ as: "global" }, async ({ jwt, cookie }) => {
			const session = cookie[SESSION_COOKIE];
			const token = session?.value;
			const payload =
				typeof token === "string" ? await jwt.verify(token) : false;
			const user: SessionUser | null = payload
				? { id: Number(payload.userId), username: payload.username }
				: null;

			return {
				user,
				startSession: async (u: SessionUser) => {
					session?.set({
						value: await jwt.sign({
							userId: String(u.id),
							username: u.username,
							exp: `${SESSION_TTL_SECONDS}s`,
						}),
						httpOnly: true,
						sameSite: "lax",
						secure: envConfig.NODE_ENV === "production",
						path: "/",
						maxAge: SESSION_TTL_SECONDS,
					});
				},
				endSession: () => {
					session?.set({
						value: "",
						httpOnly: true,
						sameSite: "lax",
						secure: envConfig.NODE_ENV === "production",
						path: "/",
						maxAge: 0,
					});
				},
			};
		});

/**
 * Protects every route registered after `.use(requireAuth())` in the same
 * instance: guests are rejected and `user` becomes a non-null `SessionUser`.
 */
export const requireAuth = () =>
	new Elysia({
		name: "plugin.require-auth",
	})
		.use(authPlugin())
		.resolve({ as: "scoped" }, ({ user, request, set, status }) => {
			if (user) {
				return { user };
			}
			// htmx requests: tell the browser to navigate. Pages: plain redirect.
			if (request.headers.has("hx-request")) {
				set.headers["hx-redirect"] = "/login";
				return status(401, "Unauthorized");
			}
			set.headers.location = "/login";
			return status(302, "");
		});
