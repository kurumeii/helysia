import { todos } from "@db";
import { dbPlugin } from "@plugin";
import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import type { Db } from "@/database/client.ts";

// Every function takes the owner's `userId` and filters by it, so one user can
// never read or change another user's todos. A wrong id looks the same as a
// missing one (`undefined` / `false`).
const owned = (userId: number, id: number) =>
	and(eq(todos.id, id), eq(todos.user_id, userId));

export const createTodoService = (db: Db) => ({
	list: (userId: number) =>
		db
			.select()
			.from(todos)
			.where(eq(todos.user_id, userId))
			.orderBy(desc(todos.id)),

	get: async (userId: number, id: number) => {
		const [row] = await db.select().from(todos).where(owned(userId, id));
		return row;
	},

	create: async (userId: number, title: string) => {
		const [row] = await db
			.insert(todos)
			.values({ user_id: userId, title })
			.returning();
		return row;
	},

	rename: async (userId: number, id: number, title: string) => {
		const [row] = await db
			.update(todos)
			.set({ title })
			.where(owned(userId, id))
			.returning();
		return row;
	},

	toggle: async (userId: number, id: number) => {
		const [row] = await db
			.update(todos)
			.set({ done: sql`not ${todos.done}` })
			.where(owned(userId, id))
			.returning();
		return row;
	},

	remove: async (userId: number, id: number) => {
		const rows = await db
			.delete(todos)
			.where(owned(userId, id))
			.returning({ id: todos.id });
		return rows.length > 0;
	},
});

export const TodoService = new Elysia({ name: "Todo.Service" })
	.use(dbPlugin)
	.derive({ as: "scoped" }, ({ db }) => ({
		todoService: createTodoService(db),
	}));
