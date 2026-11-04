import { Elysia } from "elysia";

type GracefulShutdownOptions = {
	/** Max time to wait for in-flight requests before forcing exit. */
	timeoutMs?: number;
};

// Stops the server on SIGINT/SIGTERM (and on uncaughtException, with exit code 1).
// Handlers are registered in `onStart`, not at import time, so importing the
// plugin has no side effects. Put cleanup (e.g. closing the db pool) in `.onStop`.
export const gracefulShutdownPlugin = ({
	timeoutMs = 10_000,
}: GracefulShutdownOptions = {}) =>
	new Elysia({
		name: "plugin.graceful-shutdown",
	}).onStart((app) => {
		let shuttingDown = false;

		const shutdown = async (reason: string, exitCode: number) => {
			// A second signal while draining must not restart the shutdown.
			if (shuttingDown) return;
			shuttingDown = true;
			console.log(`Received ${reason}. Initiating graceful shutdown...`);

			// A hung in-flight request would block app.stop() forever.
			setTimeout(() => {
				console.error("Graceful shutdown timed out. Forcing exit.");
				process.exit(1);
			}, timeoutMs).unref();

			let finalCode = exitCode;
			try {
				await app.stop();
			} catch (error) {
				console.error(error);
				finalCode = 1;
			}
			process.exit(finalCode);
		};

		process
			.on("SIGINT", (signal) => shutdown(signal, 0))
			.on("SIGTERM", (signal) => shutdown(signal, 0))
			.on("uncaughtException", (error) => {
				console.error(error);
				shutdown("uncaughtException", 1);
			});
	});
