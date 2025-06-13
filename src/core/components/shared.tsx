import { Html } from "@elysiajs/html"

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
				<script src="/static/scripts/htmx.min.js" />
				<link rel="stylesheet" href="/static/global.css" />
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
			<body
				hx-boost={true}
				class={"h-screen w-screen flex justify-center items-center"}
			>
				{safeChildren}
			</body>
		</html>
	)
}
