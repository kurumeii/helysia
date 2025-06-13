import { etag } from "@bogeychan/elysia-etag"
import { cors } from "@elysiajs/cors"
import { html } from "@elysiajs/html"
import { swagger } from "@elysiajs/swagger"
import { customPlugin } from "@plugin"
import { logger } from "@tqman/nice-logger"
import { Elysia } from "elysia"
import { autoload } from "elysia-autoload"
import { helmet } from "elysia-helmet"

export const app = new Elysia()
	.use(logger())
	.use(swagger())
	.use(cors())
	.use(html())
	.use(etag())
	.use(helmet())
	.use(customPlugin())
	.use(await autoload())

export type ElysiaApp = typeof app
