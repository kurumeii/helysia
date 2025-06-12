import type { ElysiaApp } from "@/server.ts"
import { Html } from "@elysiajs/html"
import type { PropsWithChildren } from "@kitajs/html"

const BaseHtml = (props: PropsWithChildren) => (
	<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<script src="/static/htmx.min.js" />
			<title>Helysia</title>
		</head>
		<body>{props.children}</body>
	</html>
)

export default (app: ElysiaApp) =>
	app
		.get("/", (ctx) =>
			ctx.html(
				<BaseHtml>
					<button type="button" hx-post="/button-click" hx-target="next p">
						Click me
					</button>
					<p id="content">This is a test</p>
				</BaseHtml>
			)
		)
		.post("/button-click", () => <h1>Button clicked</h1>)
