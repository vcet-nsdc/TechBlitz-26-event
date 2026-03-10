import { buildApp } from "./app";
import { createScoreWorker } from "./workers/scoreWorker";
import { createSubmissionWorker } from "./workers/submissionWorker";

async function startServer(): Promise<void> {
  const app = await buildApp();

  const scoreWorker = createScoreWorker(app);
  const submissionWorker = createSubmissionWorker(app);

  app.addHook("onClose", async () => {
    await scoreWorker.close();
    await submissionWorker.close();
  });

  const port = Number(process.env.PORT ?? 4000);
  const host = "0.0.0.0";
  await app.listen({ port, host });
}

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
