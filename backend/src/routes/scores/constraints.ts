import { FastifyInstance } from "fastify";
import { AppError } from "../../lib/errors";

type ScoreCriterionInput = {
  criteriaId: string;
  value: number;
};

type EnforceScoreConstraintsInput = {
  app: FastifyInstance;
  teamDomain: "UIUX" | "AGENTIC_AI" | "VIBE_CODING";
  round: string;
  criteria: ScoreCriterionInput[];
};

export async function enforceScoreConstraints({
  app,
  teamDomain,
  round,
  criteria
}: EnforceScoreConstraintsInput): Promise<void> {
  const seen = new Set<string>();
  for (const criterion of criteria) {
    if (seen.has(criterion.criteriaId)) {
      throw new AppError("Duplicate criteriaId in score payload", 400);
    }
    seen.add(criterion.criteriaId);
  }

  const criteriaIds = criteria.map((item) => item.criteriaId);
  const dbCriteria = await app.prisma.scoreCriteria.findMany({
    where: {
      id: { in: criteriaIds }
    },
    select: {
      id: true,
      domain: true,
      maxScore: true,
      isFinal: true
    }
  });

  if (dbCriteria.length !== criteriaIds.length) {
    throw new AppError("One or more score criteria are invalid", 400);
  }

  const roundIsFinal = round.trim().toLowerCase() === "finals";
  const criteriaMap = new Map(dbCriteria.map((item) => [item.id, item]));

  for (const item of criteria) {
    const criterion = criteriaMap.get(item.criteriaId);
    if (!criterion) {
      throw new AppError("One or more score criteria are invalid", 400);
    }

    if (criterion.domain !== teamDomain) {
      throw new AppError("Criteria does not belong to the team's domain", 400);
    }

    if (criterion.isFinal !== roundIsFinal) {
      throw new AppError(
        roundIsFinal
          ? "Final round requires final criteria"
          : "Non-final round requires non-final criteria",
        400
      );
    }

    if (item.value > criterion.maxScore) {
      throw new AppError(`Score exceeds maxScore for criteria ${criterion.id}`, 400);
    }
  }
}
