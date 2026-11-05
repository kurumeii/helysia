import { ErrorAlert } from "@components/error-alert.tsx";
import { Elysia } from "elysia";
import { HX } from "@/shared/routes.ts";

export const errorPlugin = () =>
	new Elysia({ name: "plugin.error" }).onError(
		{ as: "global" },
		({ code, request, status }) => {
			const isHtmx = request.headers.has(HX.request);

			if (code === "VALIDATION" && isHtmx) {
				return status(
					422,
					ErrorAlert({
						children: "Invalid input. Check the form and try again.",
					}),
				);
			}

			if (code === "UNKNOWN" || code === "INTERNAL_SERVER_ERROR") {
				const message = "Something went wrong. Please try again.";
				return isHtmx
					? status(500, ErrorAlert({ children: message }))
					: status(500, message);
			}
		},
	);
