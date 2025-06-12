import { etag } from "@bogeychan/elysia-etag"
import { envConfig } from "@config"
import { bearer } from "@elysiajs/bearer"
import { cors } from "@elysiajs/cors"
import { html } from "@elysiajs/html"
import { jwt } from "@elysiajs/jwt"
import { staticPlugin } from "@elysiajs/static"
import { swagger } from "@elysiajs/swagger"
import { logger } from "@tqman/nice-logger"
import { Elysia } from "elysia"
import { autoload } from "elysia-autoload"
import { helmet } from "elysia-helmet"

export const app = new Elysia({
	aot: false,
})
	.use(logger())
	.use(swagger())
	.use(bearer())
	.use(cors())
	.use(html())
	.use(etag())
	.use(helmet())
	.use(jwt({ secret: envConfig.JWT_SECRET }))
	.use(
		staticPlugin({
			assets: "/public",
			prefix: "/static",
		})
	)
	.use(await autoload())

export type ElysiaApp = typeof app
