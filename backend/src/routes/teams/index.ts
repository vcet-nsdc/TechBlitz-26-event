import { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../middleware/authenticate";
import { AppError } from "../../lib/errors";
import { AuthUser } from "../../types/entities";

const teamRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/",
    {
      preHandler: [authenticate(["admin"])]
    },
    async () => {
      return app.prisma.team.findMany({
        include: {
          lab: true,
          participants: true,
          submission: true
        }
      });
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [authenticate(["judge", "admin", "participant"])]
    },
    async (request) => {
      const user = request.user as AuthUser;
      const params = request.params as { id: string };

      if (user.role === "participant" && user.teamId !== params.id) {
        throw new AppError("Forbidden", 403);
      }

      const team = await app.prisma.team.findUnique({
        where: { id: params.id },
        include: {
          lab: true,
          participants: {
            select: { id: true, name: true, email: true }
          },
          submission: true,
          scores: {
            include: { criteria: true, judge: { select: { id: true, name: true, email: true } } }
          }
        }
      });

      if (!team) {
        throw new AppError("Team not found", 404);
      }

      const roundSummary = team.scores.reduce<Record<string, number>>((acc, score) => {
        acc[score.round] = (acc[score.round] ?? 0) + score.value;
        return acc;
      }, {});

      return {
        ...team,
        scoreSummary: roundSummary
      };
    }
  );
};

export default teamRoutes;
