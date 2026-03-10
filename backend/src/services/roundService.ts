import { Domain, EventPhase, PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { redisKeys } from "../lib/redis";

export async function updateEventPhase(prisma: PrismaClient, phase: EventPhase) {
  return prisma.eventConfig.upsert({
    where: { id: 1 },
    create: { id: 1, phase },
    update: { phase }
  });
}

export async function promoteTopFinalists(
  prisma: PrismaClient,
  redis: Redis,
  domain: Domain
): Promise<Array<{ teamId: string; teamName: string; labScore: number }>> {
  const tuples = await redis.zrevrange(redisKeys.domainLeaderboard(domain), 0, 4, "WITHSCORES");
  const shortlist = [];
  for (let i = 0; i < tuples.length; i += 2) {
    shortlist.push({ teamId: tuples[i], labScore: Number(tuples[i + 1]) });
  }

  const ids = shortlist.map((entry) => entry.teamId);
  await prisma.team.updateMany({
    where: { id: { in: ids } },
    data: { inFinals: true }
  });

  const teams = await prisma.team.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
  const nameMap = new Map(teams.map((team) => [team.id, team.name]));

  return shortlist.map((entry) => ({
    teamId: entry.teamId,
    teamName: nameMap.get(entry.teamId) ?? "Unknown Team",
    labScore: entry.labScore
  }));
}
