import { ErrorAlert } from "@components/error-alert.tsx";
import { authPlugin } from "@plugin";
import { Elysia, t } from "elysia";
import { HX, ROUTES } from "@/shared/routes.ts";
import { AuthService } from "../service.ts";
import { RegisterPage } from "./page.tsx";

export default new Elysia()
	.use(authPlugin())
	.use(AuthService)
	.get("/", ({ user, redirect }) =>
		user ? redirect(ROUTES.todos) : <RegisterPage />,
	)
	.post(
		"/",
		async ({ body, authService, set, status, startSession }) => {
			const created = await authService.register(body.username, body.password);
			if (!created) {
				return status(
					409,
					<ErrorAlert>That username is already taken.</ErrorAlert>,
				);
			}

			await startSession(created);
			set.headers[HX.redirect] = ROUTES.todos;
			return "";
		},
		{
			body: t.Object({
				username: t.String({ pattern: "^[A-Za-z0-9_]{3,32}$" }),
				password: t.String({ minLength: 8, maxLength: 128 }),
			}),
		},
	);
