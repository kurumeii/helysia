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
import { HX, ROUTES } from "@/shared/routes.ts";

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

const registered = new Set(
	app.routes.map(({ path }) =>
		path.length > 1 ? path.replace(/\/$/, "") : path,
	),
);
const missing = Object.values(ROUTES).filter((path) => !registered.has(path));
if (missing.length > 0) {
	throw new Error(
		`ROUTES is out of sync with src/modules. Not registered: ${missing.join(", ")}`,
	);
}
