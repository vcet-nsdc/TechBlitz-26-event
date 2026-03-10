import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { AppError } from "../../lib/errors";
import { AuthUser } from "../../types/entities";

const promptSchema = z.object({
  promptText: z.string().min(1),
  toolUsed: z.string().optional()
});

const promptRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    {
      preHandler: [authenticate(["participant"])],
      schema: {
        body: {
          type: "object",
          required: ["promptText"],
          properties: {
            promptText: { type: "string", minLength: 1 },
            toolUsed: { type: "string" }
          }
        }
      }
    },
    async (request, reply) => {
      const payload = promptSchema.parse(request.body);
      const user = request.user as AuthUser;
      if (!user.teamId) {
        throw new AppError("Participant has no team assigned", 400);
      }
      const log = await app.prisma.promptLog.create({
        data: {
          teamId: user.teamId,
          promptText: payload.promptText,
          toolUsed: payload.toolUsed
        }
      });
      return reply.status(201).send(log);
    }
  );

  app.get(
    "/my",
    {
      preHandler: [authenticate(["participant"])]
    },
    async (request) => {
      const user = request.user as AuthUser;
      if (!user.teamId) {
        throw new AppError("Participant has no team assigned", 400);
      }
      return app.prisma.promptLog.findMany({
        where: { teamId: user.teamId },
        orderBy: { loggedAt: "desc" }
      });
    }
  );
};

export default promptRoutes;
