import { Domain } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { authenticate } from "../../middleware/authenticate";
import { AppError } from "../../lib/errors";
import { AuthUser } from "../../types/entities";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  teamName: z.string().min(2),
  domain: z.nativeEnum(Domain)
});

const participantRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["name", "email", "teamName", "domain"],
          properties: {
            name: { type: "string", minLength: 2 },
            email: { type: "string", format: "email" },
            teamName: { type: "string", minLength: 2 },
            domain: { type: "string", enum: ["UIUX", "AGENTIC_AI", "VIBE_CODING"] }
          }
        }
      }
    },
    async (request, reply) => {
      const payload = registerSchema.parse(request.body);
      const email = payload.email.toLowerCase();

      const existing = await app.prisma.participant.findUnique({ where: { email } });
      if (existing) {
        throw new AppError("Participant email already registered", 409);
      }

      const labs = await app.prisma.lab.findMany({
        where: { domain: payload.domain },
        include: { _count: { select: { teams: true } } }
      });
      if (!labs.length) {
        throw new AppError("No labs available for selected domain", 400);
      }

      const chosenLab = [...labs].sort((a, b) => a._count.teams - b._count.teams)[0];
      let team = await app.prisma.team.findFirst({
        where: {
          name: payload.teamName,
          labId: chosenLab.id,
          domain: payload.domain
        }
      });

      if (!team) {
        team = await app.prisma.team.create({
          data: {
            name: payload.teamName,
            labId: chosenLab.id,
            domain: payload.domain
          }
        });
      }

      const participant = await app.prisma.participant.create({
        data: {
          name: payload.name,
          email,
          teamId: team.id
        }
      });

      const token = await app.jwt.sign({
        id: participant.id,
        role: "participant",
        teamId: team.id,
        email: participant.email
      });

      return reply.status(201).send({
        participant: {
          id: participant.id,
          name: participant.name,
          email: participant.email
        },
        team: {
          id: team.id,
          name: team.name,
          labId: team.labId,
          domain: team.domain
        },
        token
      });
    }
  );

  app.get(
    "/me",
    {
      preHandler: [authenticate(["participant"])]
    },
    async (request) => {
      const user = request.user as AuthUser;
      const participant = await app.prisma.participant.findUnique({
        where: { id: user.id },
        include: {
          team: {
            include: {
              lab: true,
              submission: true
            }
          }
        }
      });
      if (!participant) {
        throw new AppError("Participant not found", 404);
      }

      return participant;
    }
  );
};

export default participantRoutes;
