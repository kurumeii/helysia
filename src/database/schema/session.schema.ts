import { index, pgTable } from "drizzle-orm/pg-core";
import { users } from "./user.schema.ts";

export const sessions = pgTable(
	"sessions",
	(b) => ({
		id: b
			.uuid("id")
			.primaryKey()
			.$defaultFn(() => Bun.randomUUIDv7()),
		user_id: b
			.uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token_hash: b.varchar("token_hash", { length: 64 }).notNull().unique(),
		expires_at: b.timestamp("expires_at").notNull(),
		created_at: b.timestamp("created_at").defaultNow().notNull(),
	}),
	(t) => [index("sessions_user_id_id_idx").on(t.user_id, t.id)],
);
