import { Domain } from "@prisma/client";
import { FastifyInstance } from "fastify";

type EnqueueScorePayload = {
  teamId: string;
  labId: string;
  domain: Domain;
  round: string;
};

export async function enqueueScoreAggregation(
  app: FastifyInstance,
  payload: EnqueueScorePayload
): Promise<void> {
  await app.scoreQueue.add("recompute-score", payload, {
    jobId: `score-${payload.teamId}-${payload.round}`,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    }
  });
}
