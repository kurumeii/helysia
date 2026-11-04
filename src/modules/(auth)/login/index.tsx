import { ErrorAlert } from "@components/shared.tsx";
import { authPlugin } from "@plugin";
import { Elysia, t } from "elysia";
import { AuthService } from "../service.ts";
import { LoginPage } from "./page.tsx";

export default new Elysia()
	.use(authPlugin())
	.use(AuthService)
	.get("/", ({ user, redirect }) => (user ? redirect("/todos") : <LoginPage />))
	.post(
		"/",
		async ({ body, authService, set, status, startSession }) => {
			const found = await authService.authenticate(
				body.username,
				body.password,
			);
			if (!found) {
				return status(
					401,
					<ErrorAlert>Invalid username or password.</ErrorAlert>,
				);
			}

			await startSession(found);
			set.headers["hx-redirect"] = "/todos";
			return "";
		},
		{
			body: t.Object({
				username: t.String({ minLength: 1, maxLength: 32 }),
				password: t.String({ minLength: 1, maxLength: 128 }),
			}),
		},
	);
