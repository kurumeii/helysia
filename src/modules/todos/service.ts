import { todos } from "@db";
import { dbPlugin } from "@plugin";
import { and, desc, eq, sql } from "drizzle-orm";
import { Elysia } from "elysia";
import type { Db } from "@/database/client.ts";
import { ResourceNotFoundError } from "@/shared/errors.ts";

// Every function takes the owner's `userId` and filters by it, so one user can
// never read or change another user's todos. A wrong id looks the same as a
// missing one (both throw `ResourceNotFoundError`).
const owned = (userId: string, id: string) =>
	and(eq(todos.id, id), eq(todos.user_id, userId));

const found = <T>(row: T | undefined) => {
	if (!row) throw new ResourceNotFoundError("Todo");
	return row;
};

export const createTodoService = (db: Db) => ({
	list: (userId: string) =>
		db
			.select()
			.from(todos)
			.where(eq(todos.user_id, userId))
			.orderBy(desc(todos.created_at)),

	get: async (userId: string, id: string) => {
		const [row] = await db.select().from(todos).where(owned(userId, id));
		return found(row);
	},

	create: async (userId: string, title: string) => {
		const [row] = await db
			.insert(todos)
			.values({ user_id: userId, title })
			.returning();
		return row;
	},

	rename: async (userId: string, id: string, title: string) => {
		const [row] = await db
			.update(todos)
			.set({ title })
			.where(owned(userId, id))
			.returning();
		return found(row);
	},

	toggle: async (userId: string, id: string) => {
		const [row] = await db
			.update(todos)
			.set({ done: sql`not ${todos.done}` })
			.where(owned(userId, id))
			.returning();
		return found(row);
	},

	remove: async (userId: string, id: string) => {
		const rows = await db
			.delete(todos)
			.where(owned(userId, id))
			.returning({ id: todos.id });
		found(rows[0]);
	},
});

export const TodoService = new Elysia({ name: "Todo.Service" })
	.use(dbPlugin)
	.derive({ as: "scoped" }, ({ db }) => ({
		todoService: createTodoService(db),
	}));
