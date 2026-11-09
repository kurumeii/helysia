import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";
import { HX, ROUTES } from "@/shared/routes.ts";
import { envPlugin } from "./env.plugin.ts";
import {
	hashToken,
	REMEMBER_TTL_SECONDS,
	SessionService,
} from "./session.plugin.ts";

const SESSION_COOKIE = "session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const REMEMBER_COOKIE = "remember";

const cookieOptions = (production: boolean) =>
	({
		httpOnly: true,
		sameSite: "lax",
		secure: production,
		path: "/",
	}) as const;

export type SessionUser = {
	id: string;
	username: string;
};

export const authPlugin = () =>
	new Elysia({
		name: "plugin.auth",
	})
		.use(envPlugin)
		.use(SessionService)
		.use(
			jwt({
				name: "jwt",
				secret: envPlugin.decorator.env.JWT_SECRET,
				schema: t.Object({
					userId: t.String(),
					username: t.String(),
				}),
			}),
		)
		.derive(
			{ as: "global" },
			async ({
				jwt,
				cookie,
				env,
				createSession,
				rotateSession,
				revokeSession,
			}) => {
				const session = cookie[SESSION_COOKIE];
				const remember = cookie[REMEMBER_COOKIE];
				const options = cookieOptions(env.NODE_ENV === "production");

				const token = session?.value;
				const payload =
					typeof token === "string" ? await jwt.verify(token) : false;
				let user: SessionUser | null = payload
					? { id: payload.userId, username: payload.username }
					: null;

				const rememberToken = remember?.value;
				if (!user && typeof rememberToken === "string" && rememberToken) {
					const revived = await rotateSession(hashToken(rememberToken));
					if (revived) {
						user = revived.user;
						session?.set({
							value: await jwt.sign({
								userId: user.id,
								username: user.username,
								exp: `${SESSION_TTL_SECONDS}s`,
							}),
							...options,
							maxAge: SESSION_TTL_SECONDS,
						});
						remember?.set({
							value: revived.token,
							...options,
							maxAge: REMEMBER_TTL_SECONDS,
						});
					}
				}

				return {
					user,
					startSession: async (u: SessionUser, rememberMe = false) => {
						session?.set({
							value: await jwt.sign({
								userId: u.id,
								username: u.username,
								exp: `${SESSION_TTL_SECONDS}s`,
							}),
							...options,
							maxAge: SESSION_TTL_SECONDS,
						});

						const previous = remember?.value;
						const hadRemember =
							typeof previous === "string" && previous.length > 0;
						if (hadRemember) await revokeSession(hashToken(previous));

						if (rememberMe) {
							remember?.set({
								value: await createSession(u.id),
								...options,
								maxAge: REMEMBER_TTL_SECONDS,
							});
						} else if (hadRemember) {
							remember?.set({
								value: "",
								...options,
								maxAge: 0,
							});
						}
					},
					endSession: async () => {
						const previous = remember?.value;
						if (typeof previous === "string" && previous.length > 0) {
							await revokeSession(hashToken(previous));
						}
						session?.set({ value: "", ...options, maxAge: 0 });
						remember?.set({ value: "", ...options, maxAge: 0 });
					},
				};
			},
		)
		.onAfterHandle({ as: "global" }, ({ user, set }) => {
			if (user) set.headers["cache-control"] = "private, no-cache";
		})
		.macro("auth", {
			resolve: ({ user, request, set, status }) => {
				if (user) {
					return { user };
				}
				if (request.headers.has(HX.request)) {
					set.headers[HX.redirect] = ROUTES.login;
					return status(401, "Unauthorized");
				}
				set.headers.location = ROUTES.login;
				return status(302, "");
			},
		});
