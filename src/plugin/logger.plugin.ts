import { Elysia, StatusMap } from "elysia";
import pc from "picocolors";

const colorStatus = (status: number) => {
	if (status >= 500) return pc.red(status);
	if (status >= 400) return pc.yellow(status);
	if (status >= 300) return pc.cyan(status);
	return pc.green(status);
};

export const loggerPlugin = () =>
	new Elysia({
		name: "plugin.logger",
	})
		.onStart(({ server }) => {
			console.log(
				`${pc.green("●")} Server started at ${pc.cyan(server?.url.origin)}`,
			);
		})
		.onError({ as: "global" }, ({ code, error }) => {
			if (code === "NOT_FOUND") return;
			console.error(error);
		})
		.derive({ as: "global" }, () => ({ startedAt: performance.now() }))
		.onAfterResponse({ as: "global" }, ({ request, path, set, startedAt }) => {
			const status =
				typeof set.status === "string"
					? StatusMap[set.status]
					: (set.status ?? 200);
			// `derive` does not run for unmatched routes (404), despite the type.
			const duration =
				startedAt === undefined
					? ""
					: pc.dim(` ${(performance.now() - startedAt).toFixed(1)}ms`);

			console.log(
				`${pc.bold(request.method)} ${path} ${colorStatus(status)}${duration}`,
			);
		});
