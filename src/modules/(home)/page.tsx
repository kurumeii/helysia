import { BaseHtml, Navbar } from "@components/shared.tsx"

export const HomePage = ({ user }: { user: { username: string } | null }) => (
	<BaseHtml title="Helysia">
		<Navbar user={user} />
		<main class="hero min-h-[70vh]">
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-5xl font-bold">Helysia</h1>
					<p class="py-6">
						Elysia + htmx + Drizzle starter. Register, log in, and manage your
						own todo list.
					</p>
					{user ? (
						<a class="btn btn-primary" href="/todos">
							Open my todos
						</a>
					) : (
						<a class="btn btn-primary" href="/register">
							Get started
						</a>
					)}
				</div>
			</div>
		</main>
	</BaseHtml>
)
