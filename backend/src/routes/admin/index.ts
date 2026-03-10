import { Domain, EventPhase } from "@prisma/client";
import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { seedDatabase } from "../../../prisma/seed";
import { authenticate } from "../../middleware/authenticate";
import { emitFinalsStarted, emitPhaseChanged, emitRoundLocked } from "../../services/broadcastService";
import { promoteTopFinalists, updateEventPhase } from "../../services/roundService";

const phaseSchema = z.object({
  phase: z.nativeEnum(EventPhase)
});

const promoteSchema = z.object({
  domain: z.nativeEnum(Domain)
});

const lockRoundSchema = z.object({
  round: z.string().min(1),
  domain: z.nativeEnum(Domain).optional()
});

const adminRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/phase",
    {
      preHandler: [authenticate(["admin"])],
      schema: {
        body: {
          type: "object",
          required: ["phase"],
          properties: {
            phase: { type: "string", enum: ["REGISTRATION", "LAB_ROUND", "FINALS", "CLOSED"] }
          }
        }
      }
    },
    async (request) => {
      const { phase } = phaseSchema.parse(request.body);
      const config = await updateEventPhase(app.prisma, phase);
      emitPhaseChanged(app.io, phase);
      return config;
    }
  );

  app.post(
    "/finals/promote",
    {
      preHandler: [authenticate(["admin"])],
      schema: {
        body: {
          type: "object",
          required: ["domain"],
          properties: {
            domain: { type: "string", enum: ["UIUX", "AGENTIC_AI", "VIBE_CODING"] }
          }
        }
      }
    },
    async (request) => {
      const { domain } = promoteSchema.parse(request.body);
      const qualified = await promoteTopFinalists(app.prisma, app.redis, domain);
      emitFinalsStarted(app.io, domain, qualified);
      return { domain, qualified };
    }
  );

  app.post(
    "/round/lock",
    {
      preHandler: [authenticate(["admin"])],
      schema: {
        body: {
          type: "object",
          required: ["round"],
          properties: {
            round: { type: "string", minLength: 1 },
            domain: { type: "string", enum: ["UIUX", "AGENTIC_AI", "VIBE_CODING"] }
          }
        }
      }
    },
    async (request) => {
      const payload = lockRoundSchema.parse(request.body);
      emitRoundLocked(app.io, payload.round, payload.domain);
      return { locked: true };
    }
  );

  app.post(
    "/seed",
    {
      preHandler: [authenticate(["admin"])]
    },
    async () => {
      await seedDatabase(app.prisma);
      return { seeded: true };
    }
  );
};

export default adminRoutes;
