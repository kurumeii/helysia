import { BaseHtml, Navbar } from "@components/shared.tsx";
import { ROUTES } from "@/shared/routes.ts";

export const LoginPage = () => (
	<BaseHtml title="Log in">
		<Navbar user={null} />
		<main class="mx-auto max-w-sm p-4">
			<form
				class="card bg-base-100 shadow-md"
				hx-post={ROUTES.login}
				hx-target="#form-error"
			>
				<div class="card-body">
					<h1 class="card-title">Log in</h1>
					<div id="form-error" />
					<input
						name="username"
						class="input w-full"
						placeholder="Username"
						autocomplete="username"
						required
					/>
					<input
						name="password"
						type="password"
						class="input w-full"
						placeholder="Password"
						autocomplete="current-password"
						required
					/>
					<button type="submit" class="btn btn-primary">
						Log in
					</button>
					<a class="link" href={ROUTES.register}>
						No account? Register
					</a>
				</div>
			</form>
		</main>
	</BaseHtml>
);
