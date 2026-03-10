import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import Fastify, { FastifyInstance } from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
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
import corsPlugin from "./plugins/cors";
import jwtPlugin from "./plugins/jwt";
import prismaPlugin from "./plugins/prisma";
import redisPlugin from "./plugins/redis";
import socketPlugin from "./plugins/socket";
import bullmqPlugin from "./plugins/bullmq";
import { AppError } from "./lib/errors";
import { AuthUser } from "./types/entities";

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
    logger: true
  });

  await app.register(corsPlugin);
  await app.register(jwtPlugin);
  await app.register(redisPlugin);
  await app.register(prismaPlugin);
  await app.register(fastifyRateLimit, {
    global: false
  });
  await app.register(socketPlugin);
  await app.register(bullmqPlugin);

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    if ("statusCode" in error && typeof error.statusCode === "number" && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ message: error.message });
    }
    app.log.error(error);
    return reply.status(500).send({ message: "Internal server error" });
  });

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
