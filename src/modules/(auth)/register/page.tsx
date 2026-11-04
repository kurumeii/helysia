import { BaseHtml, Navbar } from "@components/shared.tsx";

export const RegisterPage = () => (
	<BaseHtml title="Register">
		<Navbar user={null} />
		<main class="mx-auto max-w-sm p-4">
			<form
				class="card bg-base-100 shadow-md"
				hx-post="/register"
				hx-target="#form-error"
			>
				<div class="card-body">
					<h1 class="card-title">Create account</h1>
					<div id="form-error" />
					<input
						name="username"
						class="input w-full"
						placeholder="Username (3-32 letters, digits, _)"
						autocomplete="username"
						pattern="[A-Za-z0-9_]{3,32}"
						required
					/>
					<input
						name="password"
						type="password"
						class="input w-full"
						placeholder="Password (min 8 characters)"
						autocomplete="new-password"
						minlength="8"
						maxlength="128"
						required
					/>
					<button type="submit" class="btn btn-primary">
						Register
					</button>
					<a class="link" href="/login">
						Already registered? Log in
					</a>
				</div>
			</form>
		</main>
	</BaseHtml>
);
