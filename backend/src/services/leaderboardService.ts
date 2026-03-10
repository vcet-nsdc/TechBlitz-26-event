import { Domain, PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { redisKeys } from "../lib/redis";
import { LeaderboardRow } from "../types/entities";

export async function buildLeaderboardEntries(
  prisma: PrismaClient,
  tuples: string[]
): Promise<LeaderboardRow[]> {
  const rows: Array<{ teamId: string; totalScore: number }> = [];
  for (let i = 0; i < tuples.length; i += 2) {
    rows.push({
      teamId: tuples[i],
      totalScore: Number(tuples[i + 1])
    });
  }

  const teamIds = rows.map((r) => r.teamId);
  const teams = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: { id: true, name: true }
  });
  const map = new Map(teams.map((team) => [team.id, team.name]));

  return rows.map((row, index) => ({
    teamId: row.teamId,
    teamName: map.get(row.teamId) ?? "Unknown Team",
    totalScore: row.totalScore,
    rank: index + 1
  }));
}

export async function recomputeDomainLeaderboard(
  prisma: PrismaClient,
  redis: Redis,
  domain: Domain
): Promise<LeaderboardRow[]> {
  const labs = await prisma.lab.findMany({
    where: { domain },
    select: { id: true }
  });

  const domainKey = redisKeys.domainLeaderboard(domain);
  await redis.del(domainKey);

  for (const lab of labs) {
    const tuples = await redis.zrevrange(redisKeys.labLeaderboard(lab.id), 0, -1, "WITHSCORES");
    for (let i = 0; i < tuples.length; i += 2) {
      await redis.zadd(domainKey, tuples[i + 1], tuples[i]);
    }
  }

  const finalTuples = await redis.zrevrange(domainKey, 0, -1, "WITHSCORES");
  return buildLeaderboardEntries(prisma, finalTuples);
}

export async function readLeaderboard(
  prisma: PrismaClient,
  redis: Redis,
  key: string
): Promise<LeaderboardRow[]> {
  const tuples = await redis.zrevrange(key, 0, -1, "WITHSCORES");
  return buildLeaderboardEntries(prisma, tuples);
}
