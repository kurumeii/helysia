import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { HomePage } from "./page.tsx";

// Public route: anyone can open it. `user` is null for guests.
export default new Elysia()
	.use(authPlugin())
	.get("/", ({ user }) => <HomePage user={user} />);
