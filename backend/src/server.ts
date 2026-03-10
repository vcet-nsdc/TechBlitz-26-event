import { validateEnv } from "./lib/validate-env";

validateEnv();

import { buildApp } from "./app";
import { createScoreWorker } from "./workers/scoreWorker";
import { createSubmissionWorker } from "./workers/submissionWorker";
import { setShuttingDown } from "./routes/health";
import { createLogger } from "./lib/logger";

const log = createLogger("server");

async function startServer(): Promise<void> {
  const app = await buildApp();

  const scoreWorker = createScoreWorker(app);
  const submissionWorker = createSubmissionWorker(app);
  const stopFigmaPoller = startFigmaPoller(app);

  app.addHook("onClose", async () => {
    stopFigmaPoller();
    await scoreWorker.close();
    await submissionWorker.close();
  });

  async function gracefulShutdown(signal: string): Promise<void> {
    log.info({ signal }, "Received shutdown signal — starting graceful shutdown");
    setShuttingDown(true);

    // Stop accepting new Socket.io connections
    if (app.io) {
      app.io.of("/judges").disconnectSockets(true);
      app.io.of("/participants").disconnectSockets(true);
      app.io.of("/broadcast").disconnectSockets(true);
    }

    // Drain in-flight requests (Fastify handles this)
    const drainTimeout = setTimeout(() => {
      log.warn("Drain timeout exceeded — forcing shutdown");
    }, 30000);

    try {
      // Close BullMQ workers (wait for active jobs)
      await Promise.race([
        Promise.all([scoreWorker.close(), submissionWorker.close()]),
        new Promise((resolve) => setTimeout(resolve, 60000))
      ]);

      // Close Fastify (closes Socket.io, Redis, Prisma via onClose hooks)
      await app.close();

      clearTimeout(drainTimeout);
      log.info("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      clearTimeout(drainTimeout);
      log.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => {
    log.error({ err: reason }, "Unhandled rejection");
    gracefulShutdown("unhandledRejection").catch(() => {
      setTimeout(() => process.exit(1), 5000);
    });
  });

  process.on("uncaughtException", (err) => {
    log.error({ err }, "Uncaught exception");
    gracefulShutdown("uncaughtException").catch(() => {
      setTimeout(() => process.exit(1), 5000);
    });
  });

  const port = Number(process.env.PORT ?? 4000);
  const host = process.env.HOST ?? "0.0.0.0";
  await app.listen({ port, host });

  log.info(
    {
      port,
      host,
      env: process.env.NODE_ENV ?? "development",
      pid: process.pid
    },
    "Server ready"
  );
}

startServer().catch((error) => {
  log.error({ err: error }, "Failed to start server");
  process.exit(1);
});
