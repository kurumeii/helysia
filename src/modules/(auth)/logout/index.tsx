import { authPlugin } from "@plugin";
import { Elysia } from "elysia";

// POST (not GET) so a link or image on another site cannot log the user out.
export default new Elysia()
	.use(authPlugin())
	.post("/", ({ endSession, set }) => {
		endSession();
		set.headers["hx-redirect"] = "/";
		return "";
	});
