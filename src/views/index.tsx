import { BaseHtml } from "@components/shared.tsx"
import type { ElysiaApp } from "@/index.ts"

export default (app: ElysiaApp) =>
	app
		.get("/", ({ html }) =>
			html(
				<BaseHtml>
					<div class="hero bg-base-200 min-h-screen">
						<div class="hero-content text-center">
							<div class="max-w-md">
								<h1 class="text-5xl font-bold">Hello there</h1>
								<div class="drawer">
									<input id="my-drawer" type="checkbox" class="drawer-toggle" />
									<div class="drawer-content">
										<label
											for="my-drawer"
											class="btn btn-primary drawer-button"
										>
											Open drawer
										</label>
									</div>
									<div class="drawer-side">
										<label
											for="my-drawer"
											aria-label="close sidebar"
											class="drawer-overlay"
										/>
										<ul class="menu bg-base-200 text-base-content min-h-full w-80 p-4">
											<li>
												<a href="/">Sidebar Item 1</a>
											</li>
											<li>
												<a href="/">Sidebar Item 2</a>
											</li>
										</ul>
									</div>
								</div>
							</div>
						</div>
					</div>
				</BaseHtml>
			)
		)
		.post("/button-click", () => <h1>Button clicked</h1>)
