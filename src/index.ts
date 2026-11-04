import { etag } from "@bogeychan/elysia-etag";
import { ErrorAlert } from "@components/shared.tsx";
import { envConfig } from "@config";
import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
import { swagger } from "@elysiajs/swagger";
import {
	gracefulShutdownPlugin,
	loggerPlugin,
	staticAssetsPlugin,
} from "@plugin";
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";
import { helmet } from "elysia-helmet";

export const app = new Elysia()
	.use(loggerPlugin())
	.use(swagger())
	.use(cors())
	.use(html())
	.use(etag())
	.use(
		helmet({
			contentSecurityPolicy: false,
		}),
	)
	.use(staticAssetsPlugin())
	.use(gracefulShutdownPlugin())
	.use(
		await autoload({
			dir: "./modules",
			pattern: "**/index.{ts,tsx}",
		}),
	)
	.onError(({ code, request, status }) => {
		if (code === "VALIDATION" && request.headers.has("hx-request")) {
			return status(
				422,
				ErrorAlert({
					children: "Invalid input. Check the form and try again.",
				}),
			);
		}
	})
	.listen(envConfig.PORT);
