import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import Fastify, { FastifyBaseLogger, FastifyInstance } from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCompress from "@fastify/compress";
import fastifyCookie from "@fastify/cookie";
import { Server } from "socket.io";
import Redis from "ioredis";
import authRoutes from "./routes/auth";
import participantRoutes from "./routes/participants";
import teamRoutes from "./routes/teams";
import submissionRoutes from "./routes/submissions";
import scoreRoutes from "./routes/scores";
import leaderboardRoutes from "./routes/leaderboard";
import promptRoutes from "./routes/prompts";
import adminRoutes from "./routes/admin";
import healthRoutes from "./routes/health";
import helmetPlugin from "./plugins/helmet";
import corsPlugin from "./plugins/cors";
import jwtPlugin from "./plugins/jwt";
import prismaPlugin from "./plugins/prisma";
import redisPlugin from "./plugins/redis";
import socketPlugin from "./plugins/socket";
import bullmqPlugin from "./plugins/bullmq";
import swaggerPlugin from "./plugins/swagger";
import { registerErrorHandler } from "./lib/errors";
import { AuthUser } from "./types/entities";
import { logger } from "./lib/logger";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    io: Server;
    scoreQueue: Queue;
    submissionQueue: Queue;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger as FastifyBaseLogger,
    requestIdHeader: "x-request-id",
    genReqId: () => crypto.randomUUID(),
    trustProxy: true
  });

  // 1. Security headers
  await app.register(helmetPlugin);

  // 2. Response compression
  await app.register(fastifyCompress, { global: true });

  // 3. Global rate limiter
  await app.register(fastifyRateLimit, {
    global: true,
    max: 200,
    timeWindow: "1 minute"
  });

  // 4. CORS
  await app.register(corsPlugin);

  // 5. Signed cookies
  await app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET,
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  });

  // 6. JWT
  await app.register(jwtPlugin);

  // 7. Swagger (non-production only)
  await app.register(swaggerPlugin);

  // 8. Database
  await app.register(prismaPlugin);

  // 9. Redis
  await app.register(redisPlugin);

  // 10. BullMQ
  await app.register(bullmqPlugin);

  // 11. Socket.io
  await app.register(socketPlugin);

  // Error handler
  registerErrorHandler(app);

  // Add X-Request-ID to all responses
  app.addHook("onSend", async (request, reply) => {
    const reqId = (request as unknown as { requestId?: string }).requestId ?? request.id;
    reply.header("X-Request-ID", reqId);
  });

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(participantRoutes, { prefix: "/participants" });
  await app.register(teamRoutes, { prefix: "/teams" });
  await app.register(submissionRoutes, { prefix: "/submissions" });
  await app.register(scoreRoutes, { prefix: "/scores" });
  await app.register(leaderboardRoutes, { prefix: "/leaderboard" });
  await app.register(promptRoutes, { prefix: "/prompts" });
  await app.register(adminRoutes, { prefix: "/admin" });

  return app;
}
