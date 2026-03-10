import { Worker, Queue } from "bullmq";
import { Domain } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { redisKeys } from "../lib/redis";
import { recomputeDomainLeaderboard, buildLeaderboardEntries } from "../services/leaderboardService";
import { computeTeamScore } from "../services/scoreService";
import {
  emitDomainLeaderboard,
  emitFinalsLeaderboard,
  emitLabLeaderboard
} from "../socket/handlers/leaderboardHandlers";
import { createLogger } from "../lib/logger";

const log = createLogger("scoreWorker");

type ScoreJobData = {
  teamId: string;
  labId: string;
  domain: Domain;
  round: string;
};

export function createScoreWorker(app: FastifyInstance): Worker<ScoreJobData> {
  const redisUrl = process.env.BULL_REDIS_URL ?? process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL must be configured");
  }

  const concurrency = Number(process.env.BULL_CONCURRENCY ?? 5);

  const dlq = new Queue("score-dlq", { connection: { url: redisUrl } });

  const worker = new Worker<ScoreJobData>(
    "score-processing",
    async (job) => {
      const { teamId, labId, domain, round } = job.data;
      const total = await computeTeamScore(app.prisma, teamId, round);

      const labKey = redisKeys.labLeaderboard(labId);
      await app.redis.zadd(labKey, total.toString(), teamId);
      const labTuples = await app.redis.zrevrange(labKey, 0, -1, "WITHSCORES");
      const labEntries = await buildLeaderboardEntries(app.prisma, labTuples);
      emitLabLeaderboard(app.io, {
        labId,
        entries: labEntries,
        timestamp: new Date().toISOString()
      });

      const domainEntries = await recomputeDomainLeaderboard(app.prisma, app.redis, domain);
      emitDomainLeaderboard(app.io, domain, {
        domain,
        entries: domainEntries,
        timestamp: new Date().toISOString()
      });

      if (round.toLowerCase() === "finals") {
        const finalsKey = redisKeys.finalsLeaderboard(domain);
        await app.redis.zadd(finalsKey, total.toString(), teamId);
        const finalsTuples = await app.redis.zrevrange(finalsKey, 0, -1, "WITHSCORES");
        const finalsEntries = await buildLeaderboardEntries(app.prisma, finalsTuples);
        emitFinalsLeaderboard(app.io, domain, {
          domain,
          entries: finalsEntries,
          timestamp: new Date().toISOString()
        });
      }
    },
    {
      connection: { url: redisUrl },
      concurrency,
      limiter: { max: 100, duration: 1000 }
    }
  );

  worker.on("failed", (job, error) => {
    log.error(
      { jobId: job?.id, attempts: job?.attemptsMade, data: job?.data, err: error },
      "Score worker job failed"
    );
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      dlq
        .add("dead-score", { ...job.data, error: error.message, failedAt: new Date().toISOString() })
        .catch((dlqErr) => log.error({ err: dlqErr }, "Failed to enqueue to DLQ"));
    }
  });

  worker.on("error", (err) => {
    log.error({ err }, "Score worker error (worker crash)");
  });

  worker.on("stalled", (jobId) => {
    log.warn({ jobId }, "Score worker job stalled");
  });

  return worker;
}
