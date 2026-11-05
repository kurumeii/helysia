import { authPlugin } from "@plugin";
import { Elysia, t } from "elysia";
import { TodoEditRow, TodoRow } from "./components.tsx";
import { TodosPage } from "./page.tsx";
import { TodoService } from "./service.ts";

const params = t.Object({ id: t.String({ format: "uuid" }) });
const body = t.Object({ title: t.String({ minLength: 1, maxLength: 200 }) });

export default new Elysia()
	.use(authPlugin())
	.use(TodoService)
	.guard({ auth: true })
	.get("/", async ({ user, todoService }) => (
		<TodosPage user={user} todos={await todoService.list(user.id)} />
	))
	.post(
		"/",
		async ({ user, todoService, body }) => {
			const row = await todoService.create(user.id, body.title);
			return row ? <TodoRow todo={row} /> : "";
		},
		{ body },
	)
	.get(
		"/:id",
		async ({ user, todoService, params }) => (
			<TodoRow todo={await todoService.get(user.id, params.id)} />
		),
		{ params },
	)
	.get(
		"/:id/edit",
		async ({ user, todoService, params }) => (
			<TodoEditRow todo={await todoService.get(user.id, params.id)} />
		),
		{ params },
	)
	.put(
		"/:id",
		async ({ user, todoService, params, body }) => (
			<TodoRow
				todo={await todoService.rename(user.id, params.id, body.title)}
			/>
		),
		{ params, body },
	)
	.patch(
		"/:id/toggle",
		async ({ user, todoService, params }) => (
			<TodoRow todo={await todoService.toggle(user.id, params.id)} />
		),
		{ params },
	)
	.delete(
		"/:id",
		async ({ user, todoService, params }) => {
			await todoService.remove(user.id, params.id);
			return "";
		},
		{ params },
	);
