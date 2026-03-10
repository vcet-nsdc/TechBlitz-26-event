import { Domain } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { redisKeys } from "../../lib/redis";
import { readLeaderboard } from "../../services/leaderboardService";

const leaderboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/lab/:labId", async (request) => {
    const params = request.params as { labId: string };
    return readLeaderboard(app.prisma, app.redis, redisKeys.labLeaderboard(params.labId));
  });

  app.get("/domain/:domain", async (request) => {
    const params = request.params as { domain: Domain };
    return readLeaderboard(app.prisma, app.redis, redisKeys.domainLeaderboard(params.domain));
  });

  app.get("/finals", async () => {
    const domains: Domain[] = ["UIUX", "AGENTIC_AI", "VIBE_CODING"];
    const allEntries = [];
    for (const domain of domains) {
      const rows = await readLeaderboard(app.prisma, app.redis, redisKeys.finalsLeaderboard(domain));
      allEntries.push(
        ...rows.map((row) => ({
          ...row,
          domain
        }))
      );
    }
    return allEntries.sort((a, b) => b.totalScore - a.totalScore);
  });
};

export default leaderboardRoutes;
