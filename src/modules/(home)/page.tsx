import { Layout } from "@components/layout.tsx";
import { ROUTES } from "@/shared/routes.ts";

export const HomePage = ({ user }: { user: { username: string } | null }) => (
	<Layout user={user} title="Helysia">
		<main class="hero min-h-[70vh]">
			<div class="hero-content text-center">
				<div class="max-w-md">
					<h1 class="text-5xl font-bold">Helysia</h1>
					<p class="py-6">
						Elysia + htmx + Drizzle starter. Register, log in, and manage your
						own todo list.
					</p>
					{user ? (
						<a class="btn btn-primary" href={ROUTES.todos}>
							Open my todos
						</a>
					) : (
						<a class="btn btn-primary" href={ROUTES.register}>
							Get started
						</a>
					)}
				</div>
			</div>
		</main>
	</Layout>
);
