import { etag } from "@bogeychan/elysia-etag"
import { envConfig } from "@config"
import { cors } from "@elysiajs/cors"
import { html } from "@elysiajs/html"
// import { swagger } from "@elysiajs/swagger"
import { customPlugin } from "@plugin"
import { logger } from "@tqman/nice-logger"
import type { SignalsListener } from "bun"
import { Elysia } from "elysia"
import { autoload } from "elysia-autoload"
import { helmet } from "elysia-helmet"

export const app = new Elysia()
	.use(logger())
	// .use(swagger())
	.use(cors())
	.use(html())
	.use(etag())
	.use(
		helmet({
			contentSecurityPolicy: false,
		})
	)
	.use(customPlugin())
	.use(
		await autoload({
			dir: "./views",
		})
	)
	.onStart(({ server }) => {
		console.log(`Server started at ${server?.url.origin}`)
	})
	.onError(({ error }) => {
		console.error(error)
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
