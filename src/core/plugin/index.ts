import { Elysia, type ElysiaConfig } from "elysia"
import { authPlugin } from "./auth.plugin.ts"
import { staticPlugin } from "./static.plugin.ts"

export const customPlugin = <T extends "">(config?: ElysiaConfig<T>) =>
	new Elysia({
		name: "plugin.custom",
		...config,
	})
		.use(authPlugin())
		.use(staticPlugin())
