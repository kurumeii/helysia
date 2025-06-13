import { envConfig } from "@config"

import { etag } from "@bogeychan/elysia-etag"
import { cors } from "@elysiajs/cors"
import { html } from "@elysiajs/html"
import { swagger } from "@elysiajs/swagger"
import { customPlugin } from "@plugin"
import { logger } from "@tqman/nice-logger"
import { Elysia } from "elysia"
import { autoload } from "elysia-autoload"
import { helmet } from "elysia-helmet"
import type { SignalsListener } from "bun"

export const app = new Elysia()
	.use(logger())
	.use(swagger())
	.use(cors())
	.use(html())
	.use(etag())
	.use(helmet())
	.use(customPlugin())
	.use(await autoload())
	.onStart(({ server }) => {
		console.log(`🦊 Server started at ${server?.url.origin}`)
	})
	.listen(envConfig.PORT)

export type ElysiaApp = typeof app

const handleShutdown: SignalsListener = async (signal) => {
	console.log(`Received ${signal}. Initiating graceful shutdown...`)
	await app.stop()
	process.exit(0)
}

process
	.on("SIGINT", handleShutdown)
	.on("SIGTERM", handleShutdown)
	.on("uncaughtException", handleShutdown)
