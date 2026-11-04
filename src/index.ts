import { etag } from "@bogeychan/elysia-etag"
import { ErrorAlert } from "@components/shared.tsx"
import { envConfig } from "@config"
import { cors } from "@elysiajs/cors"
import { html } from "@elysiajs/html"
import { swagger } from "@elysiajs/swagger"
import { staticPlugin } from "@plugin"
import { logger } from "@tqman/nice-logger"
import type { SignalsListener } from "bun"
import { Elysia } from "elysia"
import { autoload } from "elysia-autoload"
import { helmet } from "elysia-helmet"

export const app = new Elysia()
	.use(logger())
	.use(swagger())
	.use(cors())
	.use(html())
	.use(etag())
	.use(
		helmet({
			contentSecurityPolicy: false,
		})
	)
	.use(staticPlugin())
	// Every `index.ts(x)` under src/modules is a controller (see AGENTS.md).
	// Folder names become URLs; `(group)` folders are dropped from the URL.
	.use(
		await autoload({
			dir: "./modules",
			pattern: "**/index.{ts,tsx}",
		})
	)
	.onStart(({ server }) => {
		console.log(`Server started at ${server?.url.origin}`)
	})
	.onError(({ code, error, request, status }) => {
		// htmx forms: show a friendly message instead of raw validation JSON.
		if (code === "VALIDATION" && request.headers.has("hx-request")) {
			return status(
				422,
				ErrorAlert({ children: "Invalid input. Check the form and try again." })
			)
		}
		console.error(error)
	})
	.listen(envConfig.PORT)

const handleShutdown: SignalsListener = async (signal) => {
	console.log(`Received ${signal}. Initiating graceful shutdown...`)
	await app.stop()
	process.exit(0)
}

process
	.on("SIGINT", handleShutdown)
	.on("SIGTERM", handleShutdown)
	.on("uncaughtException", handleShutdown)
