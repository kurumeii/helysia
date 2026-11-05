import { authPlugin } from "@plugin";
import { Elysia, t } from "elysia";
import { TodoEditRow, TodoRow, TodoRows } from "./components.tsx";
import { TodosPage } from "./page.tsx";
import { TodoService } from "./service.ts";

const params = t.Object({ id: t.String({ format: "uuid" }) });
const query = t.Object({ after: t.String({ format: "uuid" }) });
const body = t.Object({ title: t.String({ minLength: 1, maxLength: 200 }) });

export default new Elysia()
	.use(authPlugin())
	.use(TodoService)
	.guard({ auth: true })
	.get("/", async ({ user, listTodos }) => {
		const { items, next } = await listTodos(user.id);
		return <TodosPage user={user} todos={items} next={next} />;
	})
	.get(
		"/more",
		async ({ user, listTodos, query }) => {
			const { items, next } = await listTodos(user.id, query.after);
			return <TodoRows todos={items} next={next} />;
		},
		{ query },
	)
	.post(
		"/",
		async ({ user, createTodo, body }) => {
			const row = await createTodo(user.id, body.title);
			return row ? <TodoRow todo={row} /> : "";
		},
		{ body },
	)
	.get(
		"/:id",
		async ({ user, getTodo, params }) => (
			<TodoRow todo={await getTodo(user.id, params.id)} />
		),
		{ params },
	)
	.get(
		"/:id/edit",
		async ({ user, getTodo, params }) => (
			<TodoEditRow todo={await getTodo(user.id, params.id)} />
		),
		{ params },
	)
	.put(
		"/:id",
		async ({ user, renameTodo, params, body }) => (
			<TodoRow todo={await renameTodo(user.id, params.id, body.title)} />
		),
		{ params, body },
	)
	.patch(
		"/:id/toggle",
		async ({ user, toggleTodo, params }) => (
			<TodoRow todo={await toggleTodo(user.id, params.id)} />
		),
		{ params },
	)
	.delete(
		"/:id",
		async ({ user, removeTodo, params }) => {
			await removeTodo(user.id, params.id);
			return "";
		},
		{ params },
	);
