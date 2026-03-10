import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { authorizeJudge } from "../../middleware/authorizeJudge";
import { scoreRateLimitConfig } from "../../middleware/rateLimiter";
import { AppError } from "../../lib/errors";
import { AuthUser } from "../../types/entities";
import { enqueueScoreAggregation } from "./processor";
import { emitScoreAccepted } from "../../socket/handlers/scoreHandlers";

const scoreSubmissionSchema = z.object({
  teamId: z.string().min(1),
  round: z.string().min(1),
  criteria: z
    .array(
      z.object({
        criteriaId: z.string().min(1),
        value: z.number().nonnegative()
      })
    )
    .min(1)
});

const scoreRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    {
      preHandler: [authenticate(["judge", "admin"]), authorizeJudge],
      config: scoreRateLimitConfig,
      schema: {
        body: {
          type: "object",
          required: ["teamId", "round", "criteria"],
          properties: {
            teamId: { type: "string", minLength: 1 },
            round: { type: "string", minLength: 1 },
            criteria: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                required: ["criteriaId", "value"],
                properties: {
                  criteriaId: { type: "string", minLength: 1 },
                  value: { type: "number", minimum: 0 }
                }
              }
            }
          }
        }
      }
    },
    async (request, reply) => {
      const payload = scoreSubmissionSchema.parse(request.body);
      const user = request.user as AuthUser;
      const team = await app.prisma.team.findUnique({
        where: { id: payload.teamId },
        include: { lab: true }
      });
      if (!team) {
        throw new AppError("Team not found", 404);
      }

      if (user.role === "judge") {
        const assignedLabs = user.assignedLabs ?? [];
        if (!assignedLabs.includes(team.labId)) {
          throw new AppError("Judge is not assigned to this team's lab", 403);
        }
      }

      const scoreRows = await app.prisma.$transaction(
        payload.criteria.map((criterion) =>
          app.prisma.score.upsert({
            where: {
              judgeId_teamId_criteriaId_round: {
                judgeId: user.id,
                teamId: payload.teamId,
                criteriaId: criterion.criteriaId,
                round: payload.round
              }
            },
            update: {
              value: criterion.value,
              submittedAt: new Date()
            },
            create: {
              judgeId: user.id,
              teamId: payload.teamId,
              criteriaId: criterion.criteriaId,
              value: criterion.value,
              round: payload.round
            }
          })
        )
      );

      await enqueueScoreAggregation(app, {
        teamId: payload.teamId,
        labId: team.labId,
        domain: team.domain,
        round: payload.round
      });

      emitScoreAccepted(app.io, {
        scoreId: scoreRows[0].id,
        teamId: payload.teamId,
        updatedAggregate: 0
      });

      return reply.status(202).send({ accepted: true });
    }
  );

  app.get(
    "/team/:teamId",
    {
      preHandler: [authenticate(["judge", "admin"])]
    },
    async (request) => {
      const user = request.user as AuthUser;
      const params = request.params as { teamId: string };
      const where =
        user.role === "admin"
          ? { teamId: params.teamId }
          : { teamId: params.teamId, judgeId: user.id };

      return app.prisma.score.findMany({
        where,
        include: {
          criteria: true,
          judge: {
            select: {
              id: true,
              name: true,
              email: true,
              domain: true
            }
          }
        },
        orderBy: { submittedAt: "desc" }
      });
    }
  );
};

export default scoreRoutes;
