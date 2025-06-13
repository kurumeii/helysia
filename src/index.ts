import { envConfig } from "@config"
import { app } from "./server.ts"

async function handleShutdown(signal: string) {
	console.log(`Received ${signal}. Initiating graceful shutdown...`)
	await app.stop()
	process.exit(0)
}

process
	.on("SIGINT", (signal) => handleShutdown(signal))
	.on("SIGTERM", (signal) => handleShutdown(signal))
	.on("uncaughtException", (error) => {
		console.error(error)
	})
	.on("unhandledRejection", (error) => {
		console.error(error)
	})

app.listen(envConfig.PORT, ({ url }) =>
	console.log(`🦊 Server started at ${url.origin}`)
)
