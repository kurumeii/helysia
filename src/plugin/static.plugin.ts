import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";

// await Bun.$`bun build:css`

export const staticAssetsPlugin = () =>
	new Elysia({
		name: "plugin.static",
	}).use(
		staticPlugin({
			prefix: "/static",
		}),
	);
