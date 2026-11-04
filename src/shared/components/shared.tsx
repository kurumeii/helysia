type BaseHtmlProps = {
	children: JSX.Element | JSX.Element[]
	title?: string
	description?: string | string[]
	meta?: string | string[]
}

export const BaseHtml = (props: BaseHtmlProps) => {
	const safeChildren = props.children
	return (
		<html lang="en" data-theme="coffee">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* Let htmx swap 4xx/5xx responses so forms can show server errors. */}
				<meta
					name="htmx-config"
					content='{"responseHandling":[{"code":".*","swap":true}]}'
				/>
				<script src="/static/scripts/htmx.min.js" />
				<link href="/static/global.css" rel="stylesheet" type="text/css" />
				<link
					href="https://cdn.jsdelivr.net/npm/daisyui@5/themes.css"
					rel="stylesheet"
					type="text/css"
				/>
				<link
					href="https://cdn.jsdelivr.net/npm/daisyui@5"
					rel="stylesheet"
					type="text/css"
				/>
				<title safe>{props.title ?? "Helysia"}</title>
				{props.description && Array.isArray(props.description) ? (
					<meta safe name="description" content={props.description.join(",")} />
				) : (
					<meta safe name="description" content={props.description} />
				)}
				{props.meta && Array.isArray(props.meta) ? (
					<meta safe name="keywords" content={props.meta.join(",")} />
				) : (
					<meta safe name="keywords" content={props.meta} />
				)}
			</head>
			<body class="min-h-screen bg-base-200">{safeChildren}</body>
		</html>
	)
}

type NavbarProps = {
	user: { username: string } | null
}

export const Navbar = ({ user }: NavbarProps) => (
	<nav class="navbar bg-base-100 shadow-sm">
		<div class="flex-1">
			<a class="btn btn-ghost text-xl" href="/">
				Helysia
			</a>
		</div>
		<div class="flex flex-none items-center gap-2">
			{user ? (
				<>
					<a class="btn btn-ghost" href="/todos">
						Todos
					</a>
					<span class="text-sm" safe>
						{user.username}
					</span>
					<button
						type="button"
						class="btn btn-outline btn-sm"
						hx-post="/logout"
					>
						Log out
					</button>
				</>
			) : (
				<>
					<a class="btn btn-ghost" href="/login">
						Log in
					</a>
					<a class="btn btn-primary" href="/register">
						Register
					</a>
				</>
			)}
		</div>
	</nav>
)

export const ErrorAlert = ({ children }: { children: JSX.Element }) => (
	<div role="alert" class="alert alert-error">
		<span>{children}</span>
	</div>
)
