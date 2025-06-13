import type { ElysiaApp } from "@/server.ts"
import { Html } from "@elysiajs/html"
import { BaseHtml } from "@shared/*"

export default (app: ElysiaApp) =>
	app
		.get("/", ({ html }) =>
			html(
				<BaseHtml>
					<button
						type="button"
						hx-post="/button-click"
						hx-target="next p"
						hx-swap="innerHTML"
						class="btn btn-primary"
					>
						Click me
					</button>
					<p id="content">This is a test</p>
				</BaseHtml>
			)
		)
		.post("/button-click", () => <h1>Button clicked</h1>)
