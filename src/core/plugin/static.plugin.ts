import { staticPlugin as _staticPlugin } from "@elysiajs/static"
import { Elysia } from "elysia"

await Bun.$`bun build:css`

export const staticPlugin = () =>
	new Elysia({
		name: "plugin.static",
	}).use(
		_staticPlugin({
			prefix: "/static",
		})
	)
