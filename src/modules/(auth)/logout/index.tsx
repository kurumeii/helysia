import { authPlugin } from "@plugin";
import { Elysia } from "elysia";
import { HX, ROUTES } from "@/shared/routes.ts";

// POST (not GET) so a link or image on another site cannot log the user out.
export default new Elysia()
	.use(authPlugin())
	.post("/", ({ endSession, set }) => {
		endSession();
		set.headers[HX.redirect] = ROUTES.home;
		return "";
	});
