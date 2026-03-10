import { Domain } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { AppError } from "../../lib/errors";
import { checkFigmaFileAccess, parseFigmaUrl } from "../../lib/figma";
import { syncFigma } from "../../services/scoreService";
import { AuthUser } from "../../types/entities";

const createTeamSchema = z.object({
  name: z.string().min(2),
  domain: z.nativeEnum(Domain),
  figmaUrl: z.string().url()
});

const teamRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    {
      preHandler: [authenticate(["admin"])],
      schema: {
        body: {
          type: "object",
          required: ["name", "domain", "figmaUrl"],
          properties: {
            name: { type: "string", minLength: 2 },
            domain: { type: "string", enum: ["UIUX", "AGENTIC_AI", "VIBE_CODING"] },
            figmaUrl: { type: "string", format: "uri" }
          }
        }
      }
    },
    async (request, reply) => {
      const payload = createTeamSchema.parse(request.body);
      const figmaFileKey = parseFigmaUrl(payload.figmaUrl);
      if (!figmaFileKey) {
        throw new AppError("Invalid Figma URL", 400);
      }

      const figmaAccessStatus = await checkFigmaFileAccess(figmaFileKey);
      if (figmaAccessStatus === "forbidden" || figmaAccessStatus === "not_found") {
        throw new AppError(
          "Figma file not accessible. Make sure view-link sharing is enabled.",
          400
        );
      }
      if (figmaAccessStatus === "failed") {
        throw new AppError("Unable to validate Figma file right now", 503);
      }

      const labs = await app.prisma.lab.findMany({
        where: { domain: payload.domain },
        include: { _count: { select: { teams: true } } }
      });
      if (!labs.length) {
        throw new AppError("No labs available for selected domain", 400);
      }

      const chosenLab = [...labs].sort((a, b) => a._count.teams - b._count.teams)[0];

      const team = await app.prisma.team.create({
        data: {
          name: payload.name,
          domain: payload.domain,
          labId: chosenLab.id,
          figmaFileKey,
          figmaAccessError: false
        }
      });

      void syncFigma(app.prisma, team.id);

      return reply.status(201).send(team);
    }
  );

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
          submission: true,
          figmaSnapshots: {
            orderBy: { takenAt: "desc" },
            take: 1
          }
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
          figmaSnapshots: {
            orderBy: { takenAt: "desc" },
            take: 1
          },
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
        figmaAccessError: team.figmaAccessError,
        figmaLatestSnapshot: team.figmaSnapshots[0] ?? null,
        scoreSummary: roundSummary
      };
    }
  );
};

export default teamRoutes;
