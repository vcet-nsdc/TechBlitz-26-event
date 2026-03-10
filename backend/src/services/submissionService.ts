import { FastifyInstance } from "fastify";
import { SubmissionType } from "@prisma/client";

export async function enqueueSubmissionValidation(
  app: FastifyInstance,
  teamId: string,
  type: SubmissionType,
  url: string
): Promise<void> {
  const submission = await app.prisma.submission.upsert({
    where: { teamId },
    update: {
      type,
      url,
      status: "PENDING",
      validatedAt: null,
      submittedAt: new Date()
    },
    create: {
      teamId,
      type,
      url,
      status: "PENDING"
    }
  });

  await app.submissionQueue.add(
    "validate-submission",
    {
      submissionId: submission.id,
      teamId,
      type,
      url
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000
      }
    }
  );
}
