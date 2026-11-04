import { requireAuth } from "@plugin"
import { Elysia, t } from "elysia"
import { TodoEditRow, TodoRow } from "./components.tsx"
import { TodosPage } from "./page.tsx"
import { TodoService } from "./service.ts"

const params = t.Object({ id: t.Numeric() })
const body = t.Object({ title: t.String({ minLength: 1, maxLength: 200 }) })

// Protected routes: `requireAuth` rejects guests and gives a non-null `user`.
export default new Elysia()
	.use(requireAuth())
	.use(TodoService)
	// Read (list)
	.get("/", async ({ user, todoService }) => (
		<TodosPage user={user} todos={await todoService.list(user.id)} />
	))
	// Create
	.post(
		"/",
		async ({ user, todoService, body }) => {
			const row = await todoService.create(user.id, body.title)
			return row ? <TodoRow todo={row} /> : ""
		},
		{ body }
	)
	// Read (one row, also used by "Cancel" in the edit form)
	.get(
		"/:id",
		async ({ user, todoService, params, status }) => {
			const row = await todoService.get(user.id, params.id)
			return row ? <TodoRow todo={row} /> : status(404, "Todo not found")
		},
		{ params }
	)
	.get(
		"/:id/edit",
		async ({ user, todoService, params, status }) => {
			const row = await todoService.get(user.id, params.id)
			return row ? <TodoEditRow todo={row} /> : status(404, "Todo not found")
		},
		{ params }
	)
	// Update
	.put(
		"/:id",
		async ({ user, todoService, params, body, status }) => {
			const row = await todoService.rename(user.id, params.id, body.title)
			return row ? <TodoRow todo={row} /> : status(404, "Todo not found")
		},
		{ params, body }
	)
	.patch(
		"/:id/toggle",
		async ({ user, todoService, params, status }) => {
			const row = await todoService.toggle(user.id, params.id)
			return row ? <TodoRow todo={row} /> : status(404, "Todo not found")
		},
		{ params }
	)
	// Delete: an empty 200 response makes htmx remove the row.
	.delete(
		"/:id",
		async ({ user, todoService, params, status }) =>
			(await todoService.remove(user.id, params.id))
				? ""
				: status(404, "Todo not found"),
		{ params }
	)
