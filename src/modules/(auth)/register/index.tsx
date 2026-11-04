import { ErrorAlert } from "@components/shared.tsx"
import { authPlugin } from "@plugin"
import { Elysia, t } from "elysia"
import { AuthService } from "../service.ts"
import { RegisterPage } from "./page.tsx"

// Public route (guests only): signed-in users are sent to /todos.
export default new Elysia()
	.use(authPlugin())
	.use(AuthService)
	.get("/", ({ user, redirect }) =>
		user ? redirect("/todos") : <RegisterPage />
	)
	.post(
		"/",
		async ({ body, authService, set, status, startSession }) => {
			const created = await authService.register(body.username, body.password)
			if (!created) {
				return status(
					409,
					<ErrorAlert>That username is already taken.</ErrorAlert>
				)
			}

			await startSession(created)
			set.headers["hx-redirect"] = "/todos"
			return ""
		},
		{
			body: t.Object({
				username: t.String({ pattern: "^[A-Za-z0-9_]{3,32}$" }),
				password: t.String({ minLength: 8, maxLength: 128 }),
			}),
		}
	)
