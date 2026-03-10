import { Worker } from "bullmq";
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

type ScoreJobData = {
  teamId: string;
  labId: string;
  domain: Domain;
  round: string;
};

export function createScoreWorker(app: FastifyInstance): Worker<ScoreJobData> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL must be configured");
  }
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
      connection: { url: redisUrl }
    }
  );

  worker.on("failed", (job, error) => {
    app.log.error({ jobId: job?.id, error }, "Score worker job failed");
  });

  return worker;
}
