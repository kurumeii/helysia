import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { HomePage } from "./page.tsx";

export default new Elysia()
	.use(authPlugin())
	.get("/", ({ user }) => <HomePage user={user} />);
