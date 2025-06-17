import { pgTable } from "drizzle-orm/pg-core"
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-typebox"

export const users = pgTable("users", (b) => ({
	id: b.integer("id").primaryKey().generatedByDefaultAsIdentity(),
	username: b.varchar("username").notNull().unique(),
	password: b.varchar("password").notNull(),
	created_at: b.timestamp("created_at").defaultNow(),
	updated_at: b.timestamp("updated_at").defaultNow(),
}))

export const userSchemas = {
	create: createInsertSchema(users),
	select: createSelectSchema(users),
	update: createUpdateSchema(users),
}
