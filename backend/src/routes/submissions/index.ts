import { SubmissionType } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { AppError } from "../../lib/errors";
import { enqueueSubmissionValidation } from "../../services/submissionService";
import { AuthUser } from "../../types/entities";

const submissionPayload = z.object({
  url: z.string().url(),
  type: z.nativeEnum(SubmissionType)
});

const submissionRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    {
      preHandler: [authenticate(["participant"])],
      schema: {
        body: {
          type: "object",
          required: ["url", "type"],
          properties: {
            url: { type: "string", format: "uri" },
            type: { type: "string", enum: ["FIGMA_LINK", "GITHUB_LINK"] }
          }
        }
      }
    },
    async (request, reply) => {
      const user = request.user as AuthUser;
      const payload = submissionPayload.parse(request.body);
      if (!user.teamId) {
        throw new AppError("Participant has no team assigned", 400);
      }

      await enqueueSubmissionValidation(app, user.teamId, payload.type, payload.url);
      return reply.status(202).send({ accepted: true });
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
      const submission = await app.prisma.submission.findUnique({
        where: { teamId: user.teamId }
      });
      return submission;
    }
  );
};

export default submissionRoutes;
