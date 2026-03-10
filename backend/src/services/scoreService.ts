import { PrismaClient } from "@prisma/client";
import { calculateFigmaScore } from "../lib/figma-scorer";
import { FigmaFetchError, fetchFigmaMetrics } from "../lib/figma";

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

function adjustMetricWithBaseline(current: number, baseline: number): number {
  return Math.max(0, current - baseline);
}

export async function syncFigma(prisma: PrismaClient, teamId: string): Promise<void> {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        labId: true,
        domain: true,
        figmaFileKey: true
      }
    });

    if (!team || !team.figmaFileKey || team.figmaFileKey.trim().length === 0) {
      return;
    }

    let metrics;
    try {
      metrics = await fetchFigmaMetrics(team.figmaFileKey);
    } catch (error) {
      if (error instanceof FigmaFetchError && error.statusCode === 403) {
        await prisma.team.update({
          where: { id: teamId },
          data: { figmaAccessError: true }
        });
      }

      if (error instanceof Error) {
        console.error("syncFigma: metric fetch failed", { teamId, message: error.message });
      } else {
        console.error("syncFigma: metric fetch failed", { teamId, error });
      }
      return;
    }

    const [previousSnapshot, baselineSnapshot] = await Promise.all([
      prisma.figmaSnapshot.findFirst({
        where: { teamId },
        orderBy: { takenAt: "desc" }
      }),
      prisma.figmaSnapshot.findFirst({
        where: { teamId },
        orderBy: { takenAt: "asc" }
      })
    ]);

    if (!baselineSnapshot) {
      await prisma.figmaSnapshot.create({
        data: {
          teamId,
          frameCount: metrics.frameCount,
          pageCount: metrics.pageCount,
          componentCount: metrics.componentCount,
          instanceCount: metrics.instanceCount,
          versionCount: metrics.versionCount,
          namedVersionCount: metrics.namedVersionCount,
          collaboratorCount: metrics.collaboratorCount
        }
      });

      await prisma.team.update({
        where: { id: teamId },
        data: { figmaAccessError: false }
      });
      return;
    }

    const baseline = baselineSnapshot;

    const adjustedCurrent = {
      frameCount: adjustMetricWithBaseline(metrics.frameCount, baseline.frameCount),
      pageCount: adjustMetricWithBaseline(metrics.pageCount, baseline.pageCount),
      componentCount: adjustMetricWithBaseline(metrics.componentCount, baseline.componentCount),
      instanceCount: adjustMetricWithBaseline(metrics.instanceCount, baseline.instanceCount),
      versionCount: adjustMetricWithBaseline(metrics.versionCount, baseline.versionCount),
      namedVersionCount: adjustMetricWithBaseline(metrics.namedVersionCount, baseline.namedVersionCount),
      collaboratorCount: adjustMetricWithBaseline(metrics.collaboratorCount, baseline.collaboratorCount)
    };

    const adjustedPrevious =
      previousSnapshot === null
        ? null
        : {
            ...previousSnapshot,
            frameCount: adjustMetricWithBaseline(previousSnapshot.frameCount, baseline.frameCount),
            pageCount: adjustMetricWithBaseline(previousSnapshot.pageCount, baseline.pageCount),
            componentCount: adjustMetricWithBaseline(previousSnapshot.componentCount, baseline.componentCount),
            instanceCount: adjustMetricWithBaseline(previousSnapshot.instanceCount, baseline.instanceCount),
            versionCount: adjustMetricWithBaseline(previousSnapshot.versionCount, baseline.versionCount),
            namedVersionCount: adjustMetricWithBaseline(previousSnapshot.namedVersionCount, baseline.namedVersionCount),
            collaboratorCount: adjustMetricWithBaseline(previousSnapshot.collaboratorCount, baseline.collaboratorCount)
          };

    await prisma.figmaSnapshot.create({
      data: {
        teamId,
        frameCount: metrics.frameCount,
        pageCount: metrics.pageCount,
        componentCount: metrics.componentCount,
        instanceCount: metrics.instanceCount,
        versionCount: metrics.versionCount,
        namedVersionCount: metrics.namedVersionCount,
        collaboratorCount: metrics.collaboratorCount
      }
    });

    const figmaScores = calculateFigmaScore(adjustedCurrent, adjustedPrevious);

    const existingScore = await prisma.score.findFirst({
      where: {
        teamId,
        round: "__FIGMA_AGGREGATE__"
      },
      select: {
        id: true,
        githubScore: true
      }
    });

    let targetJudgeId: string | null = null;
    let targetCriteriaId: string | null = null;

    if (!existingScore) {
      const judgeLab = await prisma.judgeLab.findFirst({
        where: { labId: team.labId },
        select: { judgeId: true }
      });
      const criteria = await prisma.scoreCriteria.findFirst({
        where: {
          domain: team.domain,
          isFinal: false
        },
        orderBy: { id: "asc" },
        select: { id: true }
      });

      targetJudgeId = judgeLab?.judgeId ?? null;
      targetCriteriaId = criteria?.id ?? null;

      if (!targetJudgeId || !targetCriteriaId) {
        console.error("syncFigma: missing judge/criteria for aggregate upsert", { teamId });
        await prisma.team.update({ where: { id: teamId }, data: { figmaAccessError: false } });
        return;
      }
    }

    const githubScore = existingScore?.githubScore ?? 0;
    const totalScore = Number(((githubScore * 0.7) + (figmaScores.figmaScore * 0.3)).toFixed(4));

    if (existingScore) {
      await prisma.score.update({
        where: { id: existingScore.id },
        data: {
          figmaScore: figmaScores.figmaScore,
          figmaActivityScore: figmaScores.figmaActivityScore,
          figureCoverageScore: figmaScores.figureCoverageScore,
          figmaMaturityScore: figmaScores.figmaMaturityScore,
          figmaCollabScore: figmaScores.figmaCollabScore,
          figmaFrameCount: metrics.frameCount,
          figmaVersionCount: metrics.versionCount,
          figmaComponentCount: metrics.componentCount,
          totalScore
        }
      });
    } else {
      await prisma.score.create({
        data: {
          judgeId: targetJudgeId as string,
          teamId,
          criteriaId: targetCriteriaId as string,
          round: "__FIGMA_AGGREGATE__",
          value: 0,
          githubScore,
          figmaScore: figmaScores.figmaScore,
          figmaActivityScore: figmaScores.figmaActivityScore,
          figureCoverageScore: figmaScores.figureCoverageScore,
          figmaMaturityScore: figmaScores.figmaMaturityScore,
          figmaCollabScore: figmaScores.figmaCollabScore,
          figmaFrameCount: metrics.frameCount,
          figmaVersionCount: metrics.versionCount,
          figmaComponentCount: metrics.componentCount,
          totalScore
        }
      });
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { figmaAccessError: false }
    });
  } catch (error) {
    console.error("syncFigma: unexpected error", { teamId, error });
  }
}
