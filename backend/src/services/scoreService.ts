import { PrismaClient } from "@prisma/client";

export async function computeTeamScore(
  prisma: PrismaClient,
  teamId: string,
  round: string
): Promise<number> {
  const scores = await prisma.score.findMany({
    where: { teamId, round },
    include: { criteria: true }
  });

  const grouped = new Map<
    string,
    { values: number[]; weight: number }
  >();

  for (const score of scores) {
    const current = grouped.get(score.criteriaId) ?? {
      values: [],
      weight: score.criteria.weight
    };
    current.values.push(score.value);
    grouped.set(score.criteriaId, current);
  }

  let total = 0;
  for (const group of grouped.values()) {
    const avg = group.values.reduce((sum, val) => sum + val, 0) / group.values.length;
    total += avg * group.weight;
  }

  return Number(total.toFixed(4));
}
