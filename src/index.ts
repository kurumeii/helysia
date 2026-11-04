import { etag } from "@bogeychan/elysia-etag";
import { ErrorAlert } from "@components/error-alert.tsx";
import { envConfig } from "@config";
import { cors } from "@elysiajs/cors";
import { html } from "@elysiajs/html";
import { swagger } from "@elysiajs/swagger";
import {
	autoloadPlugin,
	gracefulShutdownPlugin,
	loggerPlugin,
	staticAssetsPlugin,
} from "@plugin";
import { Elysia } from "elysia";
import { helmet } from "elysia-helmet";
import { HX } from "@/shared/routes.ts";

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
	.use(await autoloadPlugin())
	.onError(({ code, request, status }) => {
		if (code === "VALIDATION" && request.headers.has(HX.request)) {
			return status(
				422,
				ErrorAlert({
					children: "Invalid input. Check the form and try again.",
				}),
			);
		}
	})
	.listen(envConfig.PORT);
