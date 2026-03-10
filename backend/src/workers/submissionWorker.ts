import { Worker } from "bullmq";
import { FastifyInstance } from "fastify";
import { emitSubmissionStatus } from "../socket/handlers/scoreHandlers";
import { validateFigmaUrl, validateGithubRepo } from "../routes/submissions/validator";

type SubmissionJobData = {
  submissionId: string;
  teamId: string;
  type: "FIGMA_LINK" | "GITHUB_LINK";
  url: string;
};

export function createSubmissionWorker(app: FastifyInstance): Worker<SubmissionJobData> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL must be configured");
  }
  const worker = new Worker<SubmissionJobData>(
    "submission-validation",
    async (job) => {
      const { submissionId, teamId, type, url } = job.data;
      await app.prisma.submission.update({
        where: { id: submissionId },
        data: { status: "VALIDATING" }
      });

      const isValid =
        type === "GITHUB_LINK" ? await validateGithubRepo(url) : await validateFigmaUrl(url);

      const status = isValid ? "VALID" : "INVALID";
      await app.prisma.submission.update({
        where: { id: submissionId },
        data: {
          status,
          validatedAt: new Date()
        }
      });

      emitSubmissionStatus(app.io, {
        teamId,
        status,
        url
      });
    },
    {
      connection: { url: redisUrl }
    }
  );

  worker.on("failed", (job, error) => {
    app.log.error({ jobId: job?.id, error }, "Submission worker job failed");
  });

  return worker;
}
